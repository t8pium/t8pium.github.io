import numpy as np

def detect(h, l):
    h=np.asarray(h,float); l=np.asarray(l,float)
    bull=np.zeros(len(h),bool); bear=np.zeros(len(h),bool)
    bull[2:]=l[2:]>h[:-2]
    bear[2:]=h[2:]<l[:-2]
    return bull,bear

def race_long(high, low, target, stop):
    for h,l in zip(high,low):
        ht=h>=target; hs=l<=stop
        if ht and hs:return 2
        if ht:return 1
        if hs:return -1
    return 0

def test_bullish_fvg_formula():
    bull,bear=detect([100,101,105],[99,100,102])
    assert bull[2] and not bear[2]

def test_bearish_fvg_formula():
    bull,bear=detect([101,100,98],[100,99,95])
    assert bear[2] and not bull[2]

def test_same_bar_is_ambiguous():
    assert race_long([111],[89],110,90)==2
