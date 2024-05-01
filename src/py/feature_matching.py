import sys
from base64 import b64decode

import cv2 as cv
import numpy as np

query_descriptors = dict()
line_index = 0

sift = cv.SIFT_create()

FLANN_INDEX_KDTREE = 1
FLANN_INDEX_LSH = 6
index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
search_params = dict(checks=50)
flann = cv.FlannBasedMatcher(index_params, search_params)


def calc_matches(feature_id, train_des):
    query_des = query_descriptors[feature_id]
    matches = flann.knnMatch(query_des, train_des, k=2)

    proper_matches_amount = 0

    for match in matches:
        if len(match) != 2:
            continue
        m, n = match
        if m.distance < 0.7 * n.distance:
            proper_matches_amount += 1

    return proper_matches_amount


def image_des_from_buffer_string(buffer_string):
    buffer = b64decode(buffer_string)
    image = cv.imdecode(np.frombuffer(buffer, np.uint8), cv.IMREAD_GRAYSCALE)
    _, des = sift.detectAndCompute(image, None)
    return des


for line in sys.stdin:
    command, *args = line.strip().split('\x1F')
    if command == 'image_des':
        img_des = image_des_from_buffer_string(args[0])
        string = '' if img_des is None else ';'.join(','.join(str(n) for n in des) for des in img_des)
        sys.stdout.write(string)
        sys.stdout.write('\x17')
        sys.stdout.flush()
    elif command == 'feature':
        feature_id = args[0]
        query_descriptors[feature_id] = image_des_from_buffer_string(args[1])
        sys.stdout.write('\x06')
        sys.stdout.flush()
    elif command == 'match':
        if args[1] != '':
            des = np.array([
                np.array([float(n) for n in des_str.split(',')]).astype(np.float32)
                for des_str in args[1].split(';')
            ])
            sys.stdout.write(str(calc_matches(args[0], des)))
        sys.stdout.write('\x17')
        sys.stdout.flush()
