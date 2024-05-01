import sys
from base64 import b64decode
from functools import reduce

import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt

from helpers import is_about, is_about_absolute


def get_wordle_distribution(image_buffer):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_COLOR)
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    _, binary = cv.threshold(gray, 30, 255, cv.THRESH_BINARY)
    contours, _ = cv.findContours(binary, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    filtered_bounds = []
    for contour in contours:
        perimeter = cv.arcLength(contour, True)
        approx = cv.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) != 4:
            continue
        filtered_bounds.append(cv.boundingRect(contour))

    # sys.stderr.write(str(filtered_bounds))
    # sys.stderr.flush()
    filtered_sorted_bounds = sorted(filtered_bounds, key=lambda bound: bound[1])

    # sys.stderr.write(str(filtered_sorted_bounds))
    # sys.stderr.write('\n')
    # sys.stderr.flush()

    # for (i, (x, y, w, h)) in zip(range(len(filtered_sorted_bounds)), filtered_sorted_bounds):
    #     hsv = [(i * 5) % 180, 255, 255]
    #     rgb = cv.cvtColor(np.uint8([[hsv]]), cv.COLOR_HSV2RGB)[0][0].tolist()
    #     cv.rectangle(image, (x, y), (x + w, y + h), rgb, 1)
    #
    # plt.imshow(image)
    # plt.show()

    evenly_spaced_bounds = []
    esb_avg_space = 0
    esb_avg_x = 0
    for bound in filtered_sorted_bounds:
        if len(evenly_spaced_bounds) <= 1:
            evenly_spaced_bounds.append(bound)
            continue

        last_bound = evenly_spaced_bounds[-1]
        last_bound_top = last_bound[1]
        bound_top = bound[1]
        space_to_bound_contour = bound_top - last_bound_top

        if is_about_absolute(bound[0], esb_avg_x):
            esb_acc_x = esb_avg_x * (len(evenly_spaced_bounds) - 1) + bound[0]
            esb_avg_x = esb_acc_x / len(evenly_spaced_bounds)
        else:
            esb_avg_x = bound[0]
            evenly_spaced_bounds = [bound]
            esb_avg_space = space_to_bound_contour
            continue

        if is_about(space_to_bound_contour, esb_avg_space, .05):
            esb_acc_space = esb_avg_space * (len(evenly_spaced_bounds) - 1) + space_to_bound_contour
            esb_avg_space = esb_acc_space / len(evenly_spaced_bounds)
            evenly_spaced_bounds.append(bound)
        else:
            evenly_spaced_bounds = [last_bound, bound]
            esb_avg_space = space_to_bound_contour
        if len(evenly_spaced_bounds) == 6:
            break

    for (x, y, w, h) in evenly_spaced_bounds:
        roi = image[y:y + h, x:x + w]
        mean_color = np.mean(roi, axis=(0, 1))
        # cv.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 2)
        sys.stdout.write(f"{x},{y},{w},{h},{','.join([str(int(c)) for c in mean_color])}\x1F")
    # plt.imshow(image)
    # plt.show()

    sys.stdout.write('\x17')
    sys.stdout.flush()


for line in sys.stdin:
    image_buffer = b64decode(line.strip())
    get_wordle_distribution(image_buffer)
