import sys
from base64 import b64decode
from statistics import median

import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np

from helpers import contour_to_bounding, bounding_area, is_about, is_about_absolute, group_by, find, \
    bounding_is_inside_other, bounding_area_is_regular


def is_about_acc_05(value, test):
    return is_about(value, test, .05)
def is_about_absolute_acc_4(value, test):
    return is_about_absolute(value, test, 4)


def get_structured_worldle_guesses(image_buffer):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_COLOR)
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    _, binary = cv.threshold(gray, 40, 255, cv.THRESH_BINARY)
    contours, _ = cv.findContours(binary, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    boundings = map(contour_to_bounding, contours)
    boundings = list(filter(lambda bounding: bounding_area(bounding) > 100, boundings))
    boundings = list(filter(lambda bounding: bounding_is_inside_other(bounding, boundings), boundings))
    height_groups = group_by(boundings, is_about_acc_05, lambda bounding: bounding[3])
    height_x_groups = list(
        map(lambda boundings: group_by(boundings, is_about_absolute_acc_4, lambda bounding: bounding[0]), height_groups)
    )
    height_y_groups = list(
        map(lambda boundings: group_by(boundings, is_about_absolute_acc_4, lambda bounding: bounding[1]), height_groups)
    )

    tradle_guesses_boundings = []

    for (x_grouped, y_grouped) in zip(height_x_groups, height_y_groups):
        x_grouped_len = []
        for group in x_grouped:
            med_bounding_area = median(map(bounding_area, group))
            group = list(filter(lambda bounding: bounding_area_is_regular(bounding, med_bounding_area), group))
            x_grouped_len.append(len(group))
        y_grouped_len = list(map(len, y_grouped))
        row_count_from_x = find(lambda element: element[1] == 4, x_grouped_len)
        row_count_from_y = y_grouped_len.count(4)

        if not row_count_from_y or not row_count_from_x or row_count_from_x != row_count_from_y:
            continue

        for boundings in y_grouped:
            if len(boundings) != 4:
                continue
            for bounding in boundings:
                tradle_guesses_boundings.append(bounding)

    if len(tradle_guesses_boundings) == 0:
        sys.stdout.write("\x17")
        sys.stdout.flush()
        return

    for (x, y, w, h) in tradle_guesses_boundings:
        sys.stdout.write(f"{x},{y},{w},{h}\x1F")

    sys.stdout.write("\x17")
    sys.stdout.flush()


for line in sys.stdin:
    image_buffer = b64decode(line.strip())
    get_structured_worldle_guesses(image_buffer)
