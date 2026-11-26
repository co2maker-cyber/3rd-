#!/usr/bin/env python3
"""다이오드 SPICE 파라미터(IS, N, RS)를 대표 특성점에 직접 맞추는 도구 (브레드보드 CAD 자체 작성).

다른 사람이 만든 SPICE 모델 파일·파라미터 값을 옮겨 쓰지 않기 위해, 데이터시트에 흔히 나오는
'이 전류에서 순방향 전압이 몇 V' 같은 사실(특성점)만 입력으로 받아 이 스크립트로 값을 새로 계산한다.
식: V = N·Vt·ln(I/IS + 1) + I·RS  (쇼클리 식 + 직렬 저항, 교과서 식)
사용: python3 breadboard/tools/fit-diode.py   → spice/bbcad-parts.lib 의 다이오드 줄에 쓸 값 출력
"""
import math

VT = 0.025865  # 27°C 열전압

# 이름: [(전류 A, 순방향 전압 V), ...] — 대표값(최대 보증값이 아님). 출처 문장은 옮기지 않고 숫자만 어림해 적음
POINTS = {
    'BB_D_SIG':   [(1e-3, 0.62), (1e-2, 0.72), (1e-1, 0.93)],   # 1N4148급 신호용
    'BB_D_RECT':  [(1e-2, 0.65), (1e-1, 0.76), (1.0, 0.93)],    # 1N4007급 1A 정류용
    'BB_D_SCHOT': [(1e-2, 0.20), (1e-1, 0.30), (1.0, 0.45)],    # 1N5819급 1A 쇼트키
    'BB_D_ZEN51': [(1e-2, 0.74), (1e-1, 0.84), (2e-1, 0.90)],   # 1N4733A급 제너의 순방향
    'BB_D_GE':    [(1e-4, 0.18), (1e-3, 0.30), (1e-2, 0.55)],   # 1N34A급 게르마늄
    'BB_D_BRDG':  [(1e-2, 0.66), (1e-1, 0.78), (1.0, 0.98)],    # 1A 브리지 정류기 안의 다이오드 1개
    'BB_D_UF':    [(1e-2, 0.72), (1e-1, 0.88), (1.0, 1.25)],    # UF4007급 1A 초고속 회복 정류용
    'BB_D_SSCH':  [(1e-4, 0.24), (1e-3, 0.32), (1e-2, 0.42), (1e-1, 0.75)],  # BAT85급 소신호 쇼트키
}

def vf(I, IS, N, RS):
    return N * VT * math.log(I / IS + 1) + I * RS

def err(p, pts):
    IS, N, RS = p
    return sum((vf(I, IS, N, RS) - V) ** 2 for I, V in pts)

def fit(pts):
    best = None
    # 거친 격자 → 좁혀 가며 찾기(외부 라이브러리 없이)
    for lg in [x / 4 for x in range(-64, -12)]:
        for N in [1 + x / 20 for x in range(0, 41)]:
            for RS in [0.005 * 1.25 ** x for x in range(0, 50)]:
                e = err((10 ** lg, N, RS), pts)
                if best is None or e < best[0]:
                    best = (e, 10 ** lg, N, RS)
    e, IS, N, RS = best
    step = [0.5, 0.1, 0.3]
    for _ in range(4000):
        improved = False
        for i in range(3):
            for sgn in (1, -1):
                p = [math.log10(IS), N, RS]
                p[i] += sgn * step[i]
                if p[1] < 0.8 or p[2] < 0:
                    continue
                cand = (10 ** p[0], p[1], p[2])
                ce = err(cand, pts)
                if ce < e:
                    e, (IS, N, RS) = ce, cand
                    improved = True
        if not improved:
            step = [x / 2 for x in step]
            if max(step) < 1e-7:
                break
    return IS, N, RS, e

if __name__ == '__main__':
    for name, pts in POINTS.items():
        IS, N, RS, e = fit(pts)
        got = ', '.join(f'{I:g}A→{vf(I, IS, N, RS):.3f}V(목표 {V})' for I, V in pts)
        print(f'{name}: IS={IS:.3e} N={N:.3f} RS={RS:.4f}   [{got}]')
