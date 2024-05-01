import sys
from functools import reduce
from collections import Counter

import cv2 as cv


def contour_to_bounding(contour) -> (int, int, int, int):
    x, y, w, h = cv.boundingRect(contour)
    return x, y, w, h


def bounding_is_square(bounding) -> bool:
    _, _, w, h = bounding
    return is_about(w / h, 1)


def bounding_is_4w_to_1h(bounding) -> bool:
    _, _, w, h = bounding
    return is_about(w / h, 4)


def bounding_area(bounding) -> int:
    _, _, w, h = bounding
    return w * h


def bounding_area_is_regular(bounding, avg_bounding_area) -> bool:
    x, y, w, h = bounding
    return avg_bounding_area * 0.9 < w * h < avg_bounding_area * 1.2


def calculate_line_lengths(points):
    line_lengths = []
    for i in range(len(points)):
        x1, y1 = points[i][0]
        next_point_index = i + 1 if i + 1 < len(points) else 0
        x2, y2 = points[next_point_index][0]
        length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** .5
        line_lengths.append(length)
    return line_lengths


def cut_so_shape_covers(image, shape):
    min_x, min_y, max_x, max_y = reduce(lambda min_max_x_y, point_wrapped: [
        min(min_max_x_y[0], point_wrapped[0][0]),
        min(min_max_x_y[1], point_wrapped[0][1]),
        max(min_max_x_y[2], point_wrapped[0][0]),
        max(min_max_x_y[3], point_wrapped[0][1]),
    ], shape, [sys.maxsize, sys.maxsize, 0, 0])
    return image[min_y:max_y, min_x:max_x]


def horizontal_line_is_duplicate(seen_lines, line):
    for test in seen_lines:
        _, ly1, _, ly2 = line
        _, ty1, _, ty2 = test
        if abs(ly1 - ty1) < 5 and abs(ly2 - ty2) < 5:
            return True
    return False


def vertical_line_is_duplicate(seen_lines, line):
    for test in seen_lines:
        lx1, _, lx2, _ = line
        tx1, _, tx2, _ = test
        if abs(lx1 - tx1) < 5 and abs(lx2 - tx2) < 5:
            return True
    return False


def is_vertical(line):
    x1, y1, x2, y2 = line
    return abs(x2 - x1) < 5


def is_horizontal(line):
    x1, y1, x2, y2 = line
    return abs(y2 - y1) < 5


def is_about(value, test, accuracy=.1):
    return test * (1 - accuracy) < value < test * (1 + accuracy)


def is_about_absolute(value, test, accuracy=2):
    return test - accuracy < value < test + accuracy


def any_sum(values, expected_sum):
    n = len(values)
    for i in range(n):
        for j in range(i + 1, n):
            if is_about(values[i] + values[j], expected_sum):
                return True
    return False


def group_by(list, predicate, get_val):
    grouped_values = []
    grouped_values_avg_values = []
    for item in list:
        sorted = False
        for (avg_value, index) in zip(grouped_values_avg_values, range(len(grouped_values_avg_values))):
            if not predicate(get_val(item), avg_value):
                continue
            grouped_values[index].append(item)
            heights = map(get_val, grouped_values[index])
            grouped_values_avg_values[index] = sum(heights) / len(grouped_values[index])
            sorted = True
        if sorted:
            continue
        sys.stderr.flush()
        grouped_values.append([item])
        grouped_values_avg_values.append(get_val(item))
    return grouped_values


def find(predicate, list):
    counter = Counter(list)
    for element, count in counter.items():
        if predicate((element, count)):
            return element
    return None


def bounding_is_inside_other(bounding, boundings):
    (x, y, w, h) = bounding
    for bounding_test in boundings:
        if bounding is bounding_test:
            continue
        (x_t, y_t, w_t, h_t) = bounding_test
        # check if the bounding is positioned max 5 pixels to the right / bottom of test_bounding
        if (0 < x - x_t < 5) and (0 < y - y_t < 5):
            return True
    return False


def bounding_position_is_regular(bounding, boundings):
    (x, y, w, h) = bounding
    x_match = False
    y_match = False
    for bounding_test in boundings:
        if bounding is bounding_test:
            continue
        (x_t, y_t, w_t, h_t) = bounding_test
        x_match |= is_about_absolute(x, x_t)
        y_match |= is_about_absolute(y, y_t)
        if x_match and y_match:
            return True
    return False


def weighted_avg_outlier_reduction(values):
    half_len = len(values) / 2
    acc = 0
    for (value, index) in zip(values, range(len(values))):
        weight = -(1 / half_len) * abs(index - half_len) + 1
        acc += weight * value
    return acc / len(values)
