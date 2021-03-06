var loggator = function (selector) {

	var	targetSelector = selector || 'body > header > nav > ul',
		targetElement = document.querySelector(targetSelector),
		formParent = targetElement.parentNode.parentNode,
		fnpEncoded = localStorage.getItem('fnp') || false,
		fnp = (fnpEncoded && atob(fnpEncoded)) ? JSON.parse(atob(fnpEncoded)) : {},
		form = document.getElementById('template_login_form').content.cloneNode(true),
		buttonTemplate = document.getElementById('template_login_button').content.cloneNode(true),
		buttonCreate = document.getElementById('login_button') ? true : targetElement.appendChild(buttonTemplate),
		button = document.getElementById('login_button');

	// First loginButton click
	button.addEventListener('click', injectForm, false);

	function injectForm (event) {
		event.preventDefault();
		// Subsequent loginButton clicks
		event.target.removeEventListener('click', injectForm, false);
		event.target.addEventListener('click', toggleForm, false);
		// Append form in header
		formParent.appendChild(form);
		// Add submit listener
		formParent.querySelector('form').addEventListener('submit', serveForm);
	}

	function toggleForm (event) {
		event.preventDefault();
		// Toggle header form
		var headerForm = formParent.querySelector('form');
		headerForm.style.display = (window.getComputedStyle(headerForm).getPropertyValue('display') === 'none') ? 'block' : 'none';
	}

	function serveForm (event) {
		event.preventDefault();
		event.target.style.display = 'none'; // hide form
		var tokenField = event.target.querySelector('form > input[type="password"]');
		if (tokenField.value.length === 40) {
			flash('loading');
			getAuth(tokenField.value);
		} else if (tokenField.value.length > 0) {
			flash('invalid token');
		}
		tokenField.value = '';
	}

	function getAuth (token) {
		fnp.token = btoa(token);
		localStorage.setItem('fnp', btoa(JSON.stringify(fnp)));
		return fetch('https://api.github.com/user', {
			headers: { Authorization: 'token ' + token}
		}).then(function (response) {
			if (response.status !== 200) {
				// Unauthorized or bad credential
				flash('invalid token');
				localStorage.removeItem('fnp');
				return false;
			} else {
				// Logged: set logout button
				if (formParent.querySelector('form')) flash('you are logged in');
				button.removeEventListener('click', injectForm, false);
				button.addEventListener('click', logout, false);
				return true;
			}
		}).catch(console.log);
	}

	function logout (event) {
		event.preventDefault();
		localStorage.removeItem('fnp');
		event.target.removeEventListener('click', logout, false);
		flash('you are logged out');
	}

	function flash (string) {
		var flashes = document.querySelectorAll('.dialog');
		for (var i = 0, len = flashes.length; i < len; i++) {
			flashes[i].parentNode.removeChild(flashes[i]);
		}
		formParent.appendChild(document.getElementById('template_dialog').content.cloneNode(true));
		formParent.querySelector('.dialog strong').innerHTML = string.charAt(0).toUpperCase() + string.slice(1) + ' <a href="javascript:history.go(0)">Reload</a>';
	}

	if (!fnp.hasOwnProperty('token')) fnp.token = false;
	return fnp.token && getAuth(atob(fnp.token)) ? (
		button.innerHTML = 'logout',
		atob(fnp.token)
	) : (
		button.innerHTML = 'login',
		false
	);
};
var logged = loggator();
