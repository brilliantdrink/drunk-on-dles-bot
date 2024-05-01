from typing import Any

from helpers import is_vertical, is_horizontal, is_about, any_sum


def is_connected_black_bar(contour) -> tuple[bool, None] | tuple[bool, Any]:
    lines_line_lengths = []
    for i in range(len(contour)):
        x1, y1 = contour[i][0]
        next_point_index = i + 1 if i + 1 < len(contour) else 0
        x2, y2 = contour[next_point_index][0]
        length = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** .5
        if length < 10:
            continue
        lines_line_lengths.append(((x1, y1, x2, y2), length))

    if len(lines_line_lengths) != 8:
        return False, None

    line_lengths = sorted(lines_line_lengths, key=lambda x: x[1])
    (bar_inner_left, bar_side_1, bar_side_2,
     cw_or_bar_inner_right_1, cw_or_bar_inner_right_2, cw_or_bar_inner_right_3, cw_or_bar_inner_right_4,
     bar_outer) = line_lengths
    cw_or_bar_inner_right = [cw_or_bar_inner_right_1, cw_or_bar_inner_right_2, cw_or_bar_inner_right_3,
                             cw_or_bar_inner_right_4]

    vertical = 'vertical'
    horizontal = 'horizontal'
    cw_or_bar_inner_right_hw = [
        vertical if is_vertical(line[0]) else
        horizontal if is_horizontal(line[0]) else
        None
        for line in cw_or_bar_inner_right
    ]

    if (is_horizontal(bar_inner_left[0]) and is_vertical(bar_side_1[0]) and is_vertical(bar_side_2[0]) and
            is_about(bar_side_1[1], bar_side_2[1]) and is_horizontal(bar_outer[0]) and
            cw_or_bar_inner_right_hw.count(vertical) == 2 and
            cw_or_bar_inner_right_hw.count(horizontal) == 2 and
            any_sum(list(map(lambda line_length: line_length[1], cw_or_bar_inner_right)), bar_outer[1])):
        cw_points = []
        for ((line, length), i) in zip(cw_or_bar_inner_right, range(len(cw_or_bar_inner_right))):
            if cw_or_bar_inner_right_hw[i] == vertical:
                cw_points.append(line[2:])
                cw_points.append(line[:2])
        contour_point_is_cw = [
            any([wrapped_point[0][0] == cw_point[0] and wrapped_point[0][1] == cw_point[1]
                 for cw_point in cw_points])
            for wrapped_point in contour
        ]
        return True, contour[contour_point_is_cw]

    return False, None
