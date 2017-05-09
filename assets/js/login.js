var login = (function (lightdm, $) {
    var selected_user = null;
    var password = null
    var $user = $('#user');
    var $pass = $('#pass');
    var $session = $('#session');
    var $status_area = $('#statusArea');
    var $signin = $('#signin');
    var $loading = $('#loading');
    var cache_backend = null;

    // private functions
    /**
	 * Get a key's value from localStorage. Keys can have two or more parts.
	 * For example: "ant:user:john:session".
	 *
	 * @param {...string} key_parts - Strings that are combined to form the key.
	 */
    var cache_get = function () {
        var key = `ant`, value;

        for (var _len = arguments.length, key_parts = new Array(_len), _key = 0; _key < _len; _key++) {
            key_parts[_key] = arguments[_key];
        }

        for (var part of key_parts) {
            key += `:${part}`;
        }

        show_prompt(`cache_get() called with key: ${key}`);

        if ('localStorage' === cache_backend) {
            value = localStorage.getItem(key);
        } else if ('Cookies' === cache_backend) {
            value = Cookies.get(key);
        } else {
            value = null;
        }

        if (null !== value) {
            show_prompt(`cache_get() key: ${key} value is: ${value}`);
        }

        return ('undefined' !== typeof (value)) ? value : null;
    }


	/**
	 * Set a key's value in localStorage. Keys can have two or more parts.
	 * For example: "ant:user:john:session".
	 *
	 * @param {string} value - The value to set.
	 * @param {...string} key_parts - Strings that are combined to form the key.
	 */
    var cache_set = function (value) {
        var key = `ant`, res;

        for (var _len2 = arguments.length, key_parts = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            key_parts[_key2 - 1] = arguments[_key2];
        }

        for (var part of key_parts) {
            key += `:${part}`;
        }
        show_prompt(`cache_set() called with key: ${key} and value: ${value}`);

        if ('localStorage' === cache_backend) {
            res = localStorage.setItem(key, value);
        } else if ('Cookies' === cache_backend) {
            res = Cookies.set(key, value);
        } else {
            res = null;
        }

        return res;
    }
    setup_cache_backend = function () {
        // Do we have access to localStorage?
        try {
            localStorage.setItem('testing', 'test');
            let test = localStorage.getItem('testing');

            if ('test' === test) {
                // We have access to localStorage
                cache_backend = 'localStorage';
            }
            localStorage.removeItem('testing');

        } catch (err) {
            // We do not have access to localStorage. Fallback to cookies.
            show_error(err);
            show_error('INFO: localStorage is not available. Using cookies for cache backend.');
            cache_backend = 'Cookies';
        }

        // Just in case...
        if ('' === cache_backend) {
            cache_backend = 'Cookies';
        }

        show_prompt(`cache_backend is: ${cache_backend}`);
    }
    var setup_users_list = function () {
        var $list = $user;
        var to_append = null;
        $.each(lightdm.users, function (i) {
            var username = lightdm.users[i].name;
            var dispname = lightdm.users[i].display_name;
            $list.append(
                '<option value="' +
                username +
                '">' +
                dispname +
                '</option>'
            );

        });
    };
    var setup_session_list = function () {
        var $list = $session;
        $.each(lightdm.sessions, function (i) {
            var sessionKey = lightdm.sessions[i].key;
            var sessionName = lightdm.sessions[i].name;
            $list.append(
                '<option value="' +
                sessionKey +
                '">' +
                sessionName +
                '</option>'
            );
        });
    };
    var select_user_from_list = function (idx) {
        var idx = idx || 0;

        find_and_display_user_picture(idx);

        if (lightdm._username) {
            lightdm.cancel_authentication();
        }

        selected_user = lightdm.users[idx].name;
        set_user_selected_session();
        if (selected_user !== null) {
            window.start_authentication(selected_user);
        }

        $pass.trigger('focus');
    };
    var find_and_display_user_picture = function (idx) {
        $('.profile-img').attr(
            'src',
            lightdm.users[idx].image
        );
    };
    var set_user_selected_session = function () {
        var selected_session = cache_get('user', selected_user, 'session');
        if (null === selected_session) {
            // This user has never logged in before let's enable the system's default
            // session.
            selected_session = lightdm.default_session;
        }
        $session.val(selected_session);
    }
    var loading = function (loading) {
        if (loading) {
            $signin.hide();
            $loading.show();
        } else {
            $signin.show();
            $loading.hide();
        }
    };

    // Functions that lightdm needs
    window.start_authentication = function (username) {
        lightdm.cancel_timed_login();
        lightdm.start_authentication(username);
    };
    window.provide_secret = function () {
        $status_area.fadeTo(0, 0);
        password = $pass.val() || null;

        if (password !== null) {
            loading(true);
            lightdm.provide_secret(password);
        }
    };
    window.authentication_complete = function () {
        show_prompt(`Authentication complete ${lightdm.is_authenticated}`);
        loading(false);
        if (lightdm.is_authenticated) {
            var selected_session = $session.val();
            show_prompt(`Authentication complete ${lightdm.authentication_user}`);
            cache_set(selected_session, 'user', lightdm.authentication_user, 'session');
            show_prompt('Logged in');
            lightdm.login(
                lightdm.authentication_user,
                selected_session
            );
        } else {
            $status_area.fadeTo(0, 1);
            select_user_from_list();
        }
    };
    // These can be used for user feedback
    window.show_error = function (e) {
        console.log('Error: ' + e);

    };
    window.show_prompt = function (e) {
        console.log('Prompt: ' + e);
    };

    // exposed outside of the closure
    var init = function () {
        $(function () {
            setup_cache_backend();
            setup_users_list();
            setup_session_list();
            select_user_from_list();
            $status_area.fadeTo(0, 0);

            $user.on('change', function (e) {
                e.preventDefault();
                var idx = e.currentTarget.selectedIndex;
                select_user_from_list(idx);
            });

            $('form').on('submit', function (e) {
                e.preventDefault();
                window.provide_secret();
            });
        });
    };

    return {
        init: init
    };
}(lightdm, jQuery));

login.init();
