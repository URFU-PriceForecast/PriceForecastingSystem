function goToMain() {
    window.location.href = '../html/stat.html';
}

document.addEventListener('DOMContentLoaded', () => {
	const openButton = document.getElementById('testButton') || document.querySelector('.top-left-btn');
	const modal = document.getElementById('siteModal');
	if (!modal) return;

	const backdrop = modal.querySelector('.signup_in_backdrop');
	const closeBtn = modal.querySelector('.signup_in_close');
	const closeables = [...modal.querySelectorAll('[data-modal-close]')];
	const panelSignup = modal.querySelector('.panel-signup');
	const panelLogin = modal.querySelector('.panel-login');
	const toggles = [...modal.querySelectorAll('.auth-toggle')];

	let isClosing = false;
	function openModal() {
		if (modal.getAttribute('aria-hidden') === 'false') return;
		modal.setAttribute('aria-hidden', 'false');
		modal.classList.add('signup_in--open');
		document.body.style.overflow = 'hidden';
		(modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))?.focus();
	}

	function closeModal() {
		if (isClosing || modal.getAttribute('aria-hidden') === 'true') return;
		isClosing = true;
		// remove open class so CSS transitions to hidden state
		modal.classList.remove('signup_in--open');
		const dialog = modal.querySelector('.signup_in_dialog') || modal;
		const onEnd = (e) => {
			if (e.target !== dialog) return;
			dialog.removeEventListener('transitionend', onEnd);
			modal.setAttribute('aria-hidden', 'true');
			document.body.style.overflow = '';
			openButton?.focus();
			isClosing = false;
		};
		dialog.addEventListener('transitionend', onEnd);
		// fallback in case transitionend doesn't fire
		setTimeout(() => {
			if (modal.getAttribute('aria-hidden') !== 'true') {
				modal.setAttribute('aria-hidden', 'true');
				document.body.style.overflow = '';
				openButton?.focus();
				isClosing = false;
			}
		}, 400);
	}

	function setMode(mode) {
		modal.dataset.mode = mode;
		const title = modal.querySelector('#siteModalTitle');
		if (!title) return;
		// determine panels
		const showPanel = mode === 'login' ? panelLogin : panelSignup;
		const hidePanel = mode === 'login' ? panelSignup : panelLogin;

		// animate panels: hide current, show next
		if (hidePanel && !hidePanel.classList.contains('hidden')) {
			hidePanel.classList.add('hidden');
		}
		if (showPanel) {
			// ensure it's visible (remove hidden) on next frame to trigger transition
			requestAnimationFrame(() => showPanel.classList.remove('hidden'));
		}

		if (mode === 'login') {
			title.textContent = 'Вход';
		} else {
			title.textContent = 'Регистрация';
		}

		// set focus to first input of the shown panel
		requestAnimationFrame(() => {
			const focusable = (showPanel && showPanel.querySelector('input,button,select,textarea')) || modal.querySelector('input,button');
			focusable?.focus();
		});
	}

	// wiring
	openButton?.addEventListener('click', () => { setMode('signup'); openModal(); });
	closeBtn?.addEventListener('click', closeModal);
	backdrop?.addEventListener('click', closeModal);
	closeables.forEach(el => el.addEventListener('click', closeModal));
	// wire all toggle links inside modal
	toggles.forEach(t => t.addEventListener('click', (e) => {
		e.preventDefault();
		const target = t.dataset.target || (modal.dataset.mode === 'login' ? 'signup' : 'login');
		setMode(target);
		openModal();
	}));

	// (removed automatic header-width matching because it could break layout)

	// site notice: create dim overlay, show on load and allow close
	const siteNotice = document.getElementById('siteNotice');
	if (siteNotice) {
		// create overlay
		const overlay = document.createElement('div');
		overlay.className = 'site-dim';
		document.body.appendChild(overlay);

		const show = () => {
			// ensure start hidden to animate
			siteNotice.classList.add('hidden');
			overlay.classList.remove('show');
			// next tick, show both
			requestAnimationFrame(() => {
				siteNotice.classList.remove('hidden');
				siteNotice.classList.add('show');
				overlay.classList.add('show');
			});
		};

		const hide = () => {
			siteNotice.classList.add('hidden');
			siteNotice.classList.remove('show');
			overlay.classList.remove('show');
			// remove after transition
			setTimeout(() => {
				if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
				if (siteNotice.parentNode) siteNotice.parentNode.removeChild(siteNotice);
			}, 300);
		};

		const siteNoticeClose = siteNotice.querySelector('.site-notice-close');
		siteNoticeClose?.addEventListener('click', hide);

		// show on load
		show();
	}

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
	});

	// start default
	setMode('signup');
});
