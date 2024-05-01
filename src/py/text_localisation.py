# https://medium.com/technovators/scene-text-detection-in-python-with-east-and-craft-cbe03dda35d5

import sys
from base64 import b64decode

import cv2 as cv
import numpy as np
# from matplotlib import pyplot as plt
from imutils.object_detection import non_max_suppression

from helpers import is_about_absolute

IMAGENET_MEAN_SUBTRACTION = (123.68, 116.78, 103.94)

net = cv.dnn.readNet('frozen_east_text_detection.pb')
# set the new width and height and then determine the ratio in change
# for both the width and height: Should be multiple of 32
(target_width, target_height) = (320, 320)


def east_detect(image_buffer, min_confidence):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_COLOR)
    layer_names = ['feature_fusion/Conv_7/Sigmoid', 'feature_fusion/concat_3']
    (H, W) = image.shape[:2]

    r_w = W / float(target_width)
    r_h = H / float(target_height)

    # orig_image = image.copy()
    image = cv.resize(image, (target_width, target_height))
    (H, W) = image.shape[:2]

    blob = cv.dnn.blobFromImage(image, 1.0, (W, H), IMAGENET_MEAN_SUBTRACTION, swapRB=True, crop=False)
    net.setInput(blob)
    (scores, geometry) = net.forward(layer_names)

    (numRows, numCols) = scores.shape[2:4]
    rects = []
    confidences = []
    for y in range(0, numRows):
        '''
        extract the scores (probabilities), followed by the geometrical data used to derive potential bounding box
        coordinates that surround text
        '''
        scores_data = scores[0, 0, y]
        x_data0 = geometry[0, 0, y]
        x_data1 = geometry[0, 1, y]
        x_data2 = geometry[0, 2, y]
        x_data3 = geometry[0, 3, y]
        angles_data = geometry[0, 4, y]

        for x in range(0, numCols):
            confidence = scores_data[x]
            if confidence < min_confidence:
                continue
            (offsetX, offsetY) = (x * 4.0, y * 4.0)
            angle = angles_data[x]
            cos = np.cos(angle)
            sin = np.sin(angle)
            h = x_data0[x] + x_data2[x]
            w = x_data1[x] + x_data3[x]
            end_x = int(offsetX + (cos * x_data1[x]) + (sin * x_data2[x]))
            end_y = int(offsetY - (sin * x_data1[x]) + (cos * x_data2[x]))
            start_x = int(end_x - w)
            start_y = int(end_y - h)
            rects.append((start_x, start_y, end_x, end_y))
            confidences.append(confidence)

    # basically remove duplicates
    boxes = non_max_suppression(np.array(rects), probs=confidences)

    for index in range(len(boxes)):
        (x, y, end_x, end_y) = boxes[index]
        x = int(x * r_w)
        y = int(y * r_h)
        end_x = int(end_x * r_w)
        end_y = int(end_y * r_h)
        w = end_x - x
        h = end_y - y
        boxes[index] = (x, y, w, h)

    ignored_indices = []

    # merge boxes
    merged_at_least_one = True
    while (merged_at_least_one == True):
        merged_at_least_one = False
        for (box_main, index_main) in zip(boxes, range(len(boxes))):
            if index_main in ignored_indices:
                continue
            for (box_merge, index_merge) in zip(boxes, range(len(boxes))):
                if index_merge in ignored_indices:
                    continue
                if (box_main == box_merge).all():
                    continue
                (x_main, y_main, width_main, height_main) = box_main
                (x_merge, y_merge, width_merge, height_merge) = box_merge
                if not is_about_absolute(y_merge, y_main, height_main * .3):
                    continue
                marge_is_after_main = x_merge < x_main
                if marge_is_after_main:
                    continue
                if x_main + width_main + width_main * .2 < x_merge:
                    continue
                merged_at_least_one = True
                # img = orig_image.copy()
                # (x, y, w, h) = box_main
                # cv.rectangle(img, (x, y), (x + w, y + h), (255, 0, 0), 2)
                # (x, y, w, h) = box_merge
                # cv.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
                x_end_merge = x_merge + width_merge
                new_box_width = x_end_merge - x_main
                boxes[index_main] = (x_main, min(y_main, y_merge), new_box_width, max(height_main, height_merge))
                # (x, y, w, h) = boxes[index_main]
                # cv.rectangle(img, (x, y), (x + w, y + h), (0, 0, 255), 2)
                ignored_indices.append(index_merge)

                # plt.imshow(img)
                # plt.show()

    for ((x, y, w, h), i) in zip(boxes, range(len(boxes))):
        if i in ignored_indices:
            continue
        # try:
        #     cv.rectangle(orig_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        # except cv.error as e:
        #     sys.stderr.write(f"a:{type(x)},{type(y)},{type(w)},{type(h)}\n")
        #     sys.stderr.write(f"b:{x},{y},{w},{h}\n")
        sys.stdout.write(f"{x},{y},{w},{h}\x1F")

    sys.stdout.write('\x17')
    sys.stdout.flush()

    # plt.imshow(orig_image)
    # plt.show()


for line in sys.stdin:
    args = line.strip().split('\x1F')
    image_buffer = b64decode(args[0])
    min_confidence = float(args[1]) if len(args) <= 2 else .2
    east_detect(image_buffer, min_confidence)
