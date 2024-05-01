import sys
from base64 import b64decode
from statistics import median

import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np

from helpers import contour_to_bounding, bounding_area, bounding_area_is_regular, bounding_is_4w_to_1h, is_about


def get_connections_matrix(image_buffer):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_COLOR)
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    _, binary = cv.threshold(gray, 230, 255, cv.THRESH_BINARY)
    contours, _ = cv.findContours(binary, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    # plt.imshow(binary, cmap='gray')
    # plt.show()

    boundings = map(contour_to_bounding, contours)
    boundings = list(filter(bounding_is_4w_to_1h, boundings))
    if len(boundings) == 0:
        sys.stdout.write("\x17")
        sys.stdout.flush()
        return
    med_bounding_area = median(map(bounding_area, boundings))
    boundings = list(filter(lambda bounding: bounding_area_is_regular(bounding, med_bounding_area), boundings))
    med_left_pos = median(map(lambda bounding: bounding[0], boundings))
    boundings = list(filter(lambda bounding: is_about(bounding[0], med_left_pos), boundings))

    for (x, y, w, h) in boundings:
        w = w / 4
        for i in range(4):
            x_ = int(x + w * i)
            roi = image[y:y + h, x_:int(x_ + w)]
            mean_color = np.mean(roi, axis=(0, 1))
            # cv.rectangle(image, (x_, y), (int(x_ + w), y + h), (255, 0, 0), 2)
            sys.stdout.write(f"{x},{y},{w},{h},{','.join([str(int(c)) for c in mean_color])}\x1F")

    # plt.imshow(image)
    # plt.show()

    sys.stdout.write("\x17")
    sys.stdout.flush()


for line in sys.stdin:
    image_buffer = b64decode(line.strip())
    get_connections_matrix(image_buffer)
