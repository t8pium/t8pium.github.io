from ig_highlight_downloader import is_instagram_profile_url, normalize_profile_input, parse_selection, safe_name


def test_safe_name_removes_invalid_filesystem_characters():
    assert safe_name('My <bad> highlight?') == 'My__bad__highlight'


def test_normalize_profile_input_accepts_username_and_at_handle():
    assert normalize_profile_input('t8pium') == 'https://www.instagram.com/t8pium/'
    assert normalize_profile_input('@t8pium') == 'https://www.instagram.com/t8pium/'


def test_profile_url_detection_accepts_profile_only():
    assert is_instagram_profile_url('https://www.instagram.com/t8pium/')
    assert not is_instagram_profile_url('https://www.instagram.com/stories/highlights/123/')
    assert not is_instagram_profile_url('https://www.instagram.com/explore/')


def test_parse_selection_supports_ranges_and_all():
    assert parse_selection('all', 3) == [1, 2, 3]
    assert parse_selection('1,3-4', 5) == [1, 3, 4]
