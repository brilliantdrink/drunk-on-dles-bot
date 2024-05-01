import sys
from base64 import b64decode
from statistics import median

import cv2 as cv
import matplotlib.pyplot as plt
import numpy as np

from helpers import contour_to_bounding, bounding_area, bounding_is_square, bounding_area_is_regular, \
    bounding_is_inside_other, bounding_position_is_regular


def get_tradle_matrix(image_buffer):
    image = cv.imdecode(np.frombuffer(image_buffer, np.uint8), cv.IMREAD_COLOR)
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    _, binary = cv.threshold(gray, 240, 255, cv.THRESH_BINARY)
    contours, _ = cv.findContours(binary, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    boundings = map(contour_to_bounding, contours)
    boundings = filter(lambda bounding: bounding_area(bounding) > 20, boundings)
    boundings = list(filter(bounding_is_square, boundings))
    if len(boundings) == 0:
        sys.stdout.write("\x17")
        sys.stdout.flush()
        return
    boundings = list(filter(lambda bounding: not bounding_is_inside_other(bounding, boundings), boundings))
    med_bounding_area = median(map(bounding_area, boundings))
    boundings = list(filter(lambda bounding: bounding_area_is_regular(bounding, med_bounding_area), boundings))
    boundings = list(filter(lambda bounding: bounding_position_is_regular(bounding, boundings), boundings))

    for (x, y, w, h) in boundings:
        roi = image[y + 10:y + 20, x + 10:x + 20]
        mean_color = np.mean(roi, axis=(0, 1))
        # cv.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        sys.stdout.write(f"{x},{y},{w},{h},{','.join([str(int(c)) for c in mean_color])}\x1F")

    sys.stdout.write("\x17")
    sys.stdout.flush()
    # plt.imshow(image)
    # plt.show()


for line in sys.stdin:
    image_buffer = b64decode(line.strip())
    get_tradle_matrix(image_buffer)
