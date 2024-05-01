import sys
from base64 import b64decode

import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np

from helpers import is_vertical, is_horizontal, is_about, calculate_line_lengths, cut_so_shape_covers, \
    horizontal_line_is_duplicate, vertical_line_is_duplicate
from detect_crossword_mini_presence_is_connected_black_bar import is_connected_black_bar


crossword_max_cols_rows = 7
crossword_min_cols_rows = 5
crossword_max_lines = crossword_max_cols_rows + 1
crossword_min_lines = crossword_min_cols_rows + 1


def check_crossword_presence(image_buffer):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_GRAYSCALE)
    _, binary = cv.threshold(image, 150, 255, cv.THRESH_BINARY_INV)
    contours, _ = cv.findContours(binary, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    approximate_square_side_size = 0

    filtered_contours = []
    for contour in contours:
        perimeter = cv.arcLength(contour, True)
        approx = cv.approxPolyDP(contour, 0.02 * perimeter, True)
        line_lengths = calculate_line_lengths(approx)
        avg_line_length = sum(line_lengths) / len(line_lengths)
        if avg_line_length < 400:
            continue
        # when the crossword touches the top/bottom black bars, those are included in the contour; removed here
        if len(approx) != 4 or not all(is_about(line_length, avg_line_length) for line_length in line_lengths):
            is_connected, contour = is_connected_black_bar(contour)
            if not is_connected:
                continue
            line_lengths = calculate_line_lengths(contour)
            avg_line_length = sum(line_lengths) / len(line_lengths)
        approximate_square_side_size = avg_line_length
        filtered_contours.append(contour)

    # todo when cursor is over a edge, this filtering doesn't work (see commented lines below)
    # filtered_contours = list(
    #     filter(lambda contour: len(cv.approxPolyDP(contour, 0.02 * perimeter, True)) >= 8, contours)
    # )[0]

    # sys.stderr.write(str(len(filtered_contours)))
    # sys.stderr.write(str(filtered_contours))
    # sys.stderr.flush()

    # image = cv.cvtColor(image, cv.COLOR_GRAY2BGR)
    # cv.drawContours(image, filtered_contours, -1, (255, 0, 0), 3)
    # sys.stderr.flush()
    # plt.imshow(image)
    # plt.show()

    if len(filtered_contours) < 1:
        sys.stdout.write(f"0\x17")
        sys.stdout.flush()
        return False

    binary_cut = cut_so_shape_covers(binary, filtered_contours[0])
    lines = cv.HoughLinesP(binary_cut, 1, np.pi / 180, 15, np.array([]), 50, 20)
    # binary_cut = cv.cvtColor(binary_cut, cv.COLOR_GRAY2BGR)

    seen_lines = []
    verticals = 0
    horizontals = 0
    for (line, i) in zip(lines, range(len(lines))):
        line = line[0]
        x1, y1, x2, y2 = line
        # filter short lines
        length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** .5
        if length < approximate_square_side_size * .8:
            continue
        # filter diagonals and duplicates
        if is_horizontal(line):
            if horizontal_line_is_duplicate(seen_lines, line):
                continue
            horizontals += 1
        elif is_vertical(line):
            if vertical_line_is_duplicate(seen_lines, line):
                continue
            verticals += 1
        else:
            continue

        seen_lines.append(line)

        # hsv = [(i * 10) % 180, 255, 255]
        # rgb = cv.cvtColor(np.uint8([[hsv]]), cv.COLOR_HSV2RGB)[0][0].tolist()
        # cv.line(binary_cut, (x1, y1), (x2, y2), rgb, 2)

    # sys.stderr.write(f"horizontals: {horizontals}, verticals: {verticals}")
    # sys.stderr.flush()
    # plt.imshow(binary_cut)
    # plt.show()

    # outer lines may sometimes not be recognized
    if (crossword_min_lines - 2 <= horizontals <= crossword_max_lines and
            crossword_min_lines - 2 <= verticals <= crossword_max_lines):
        sys.stdout.write(f"1\x17")
    else:
        sys.stdout.write(f"0\x17")

    sys.stdout.flush()


for line in sys.stdin:
    image_buffer = b64decode(line.strip())
    check_crossword_presence(image_buffer)
