function goToMain() {
    window.location.href = '../html/stat.html';
}

document.addEventListener('DOMContentLoaded', () => {
	const openButton = document.getElementById('testButton') || document.querySelector('.top-left-btn');
	let catalogButton = document.getElementById('catalogButton');
	// fallback: sometimes the markup may use an <a> or different class
	if (!catalogButton) catalogButton = document.querySelector('.input-container .test-button') || document.querySelector('.test-button');
	// products would normally be fetched from the API (or CSV from dtasetik.py). The code below
	// will call the API endpoints we add in the ASP.NET project. A local fallback is included.
	const productsFallback = [
		{ id:1, article:'482159736', name:'Смартфон iPhone 15 128GB', category_id:2 },
		{ id:2, article:'5938472610', name:'Смартфон iPhone 15 256GB' },
		{ id:3, article:'620184735', name:'Смартфон Samsung Galaxy S24 128GB' },
		{ id:4, article:'7493825160', name:'Смартфон Samsung Galaxy S23 256GB' },
		{ id:5, article:'815937402', name:'Смартфон Xiaomi 13 Lite 128GB' },
		{ id:6, article:'9264738151', name:'Смартфон Xiaomi Redmi Note 12 128GB' },
		{ id:7, article:'1038574926', name:'Смартфон OPPO Reno 10 256GB' },
		{ id:8, article:'284619537', name:'Ноутбук MacBook Pro 14" M3 512GB' },
		{ id:9, article:'3957281640', name:'Ноутбук MacBook Air 13" M2 256GB' },
		{ id:10, article:'462839175', name:'Ноутбук ASUS VivoBook 15 i5 512GB' },
		{ id:11, article:'5739462810', name:'Ноутбук ASUS ZenBook 13 i7 1TB' },
		{ id:12, article:'684157392', name:'Ноутбук Lenovo IdeaPad 5 i5 512GB' },
		{ id:13, article:'7952684031', name:'Ноутбук Lenovo ThinkPad T14 i7 512GB' },
		{ id:14, article:'826394715', name:'Ноутбук HP Envy 13 i5 512GB' },
		{ id:15, article:'9374851260', name:'Наушники AirPods Pro 2' },
		{ id:16, article:'148259637', name:'Наушники AirPods 3' },
		{ id:17, article:'2593671480', name:'Наушники Sony WH-1000XM5' },
		{ id:18, article:'360478259', name:'Наушники Sony LinkBuds S' },
		{ id:19, article:'4715893601', name:'Наушники Samsung Galaxy Buds2 Pro' },
		{ id:20, article:'582690471', name:'Наушники JBL Tune 770NC' },
		{ id:21, article:'6937015820', name:'Электрочайник Philips HD9359 1.7L' },
		{ id:22, article:'704812693', name:'Электрочайник Tefal KO851 1.7L' },
		{ id:23, article:'8159237041', name:'Электрочайник Bosch TWK 550' },
		{ id:24, article:'926034815', name:'Блендер Braun Multiquick 7 MQ 7045' },
		{ id:25, article:'1371459260', name:'Блендер Philips HR3556 2L' },
		{ id:26, article:'248256137', name:'Блендер Moulinex LM935 1.5L' },
		{ id:27, article:'3593672480', name:'Кофеварка DeLonghi ECAM 320' },
		{ id:28, article:'460478359', name:'Кофеварка Philips EP5400' },
		{ id:29, article:'5715894601', name:'Тостер Bosch TAT 7A1' },
		{ id:30, article:'682690571', name:'Тостер Tefal Toast & Go TT1' }
	];

	// ensure every fallback item has a category_id (reflects how dtasetik groups items)
	productsFallback.forEach(p => {
		if (!('category_id' in p) || !p.category_id) {
			const id = p.id;
			if (id <= 7) p.category_id = 2;
			else if (id <= 14) p.category_id = 3;
			else if (id <= 20) p.category_id = 4;
			else p.category_id = 6;
		}
	});

	// create products modal (reuses modal CSS in page)
	function createProductsModalMarkup() {
		if (document.getElementById('productsModal')) return;
		const modal = document.createElement('div');
		modal.id = 'productsModal';
		modal.className = 'signup_in';
		// ensure modal overlays any site-wide dim overlays
		modal.style.zIndex = '2200';
		modal.setAttribute('aria-hidden', 'true');
		// hide by default so it doesn't block clicks when created
		modal.style.display = 'none';
		modal.innerHTML = `
			<div class="signup_in_backdrop" data-modal-close></div>
			<div class="signup_in_dialog" role="document">
				<header class="signup_in_header">
					<h2 id="productsModalTitle">Каталог товаров</h2>
					<button class="signup_in_close" aria-label="Закрыть">&times;</button>
				</header>
				<div class="signup_in_body">
					<div id="productsModalBody"></div>
				</div>
			</div>`;
		document.body.appendChild(modal);
		return modal;
	}

	function renderProductsTableTo(container, items) {
		container.innerHTML = '';
		const table = document.createElement('table');
		table.className = 'products-table';
		const tbody = document.createElement('tbody');
		(items || productsFallback).forEach(p => {
			const tr = document.createElement('tr');
			const td = document.createElement('td');
			td.textContent = `${p.name} | ${p.article}`;
			tr.appendChild(td);
			tbody.appendChild(tr);
		});
		table.appendChild(tbody);
		container.appendChild(table);
	}

	async function openProductsModal() {
		const modal = createProductsModalMarkup();
		modal.style.display = 'flex';
		const body = modal.querySelector('#productsModalBody');
		// First, show simple loading
		body.innerHTML = '<div>Загрузка каталога...</div>';

		// Fetch categories and products from API if available
		let categories = [];
		try {
			const catResp = await fetch('http://localhost:5229/api/categories');
			if (catResp.ok) categories = await catResp.json();
		} catch (e) {
			// ignore and fallback
			// user asked for specific category names: smartphones,laptops,headphones,kitchen
			categories = [
				{ id: 2, name: 'smartphones' },
				{ id: 3, name: 'laptops' },
				{ id: 4, name: 'headphones' },
				{ id: 6, name: 'kitchen' }
			];
		}

		// create filter controls (single dropdown select)
		const controlRow = document.createElement('div');
		controlRow.className = 'products-filter-row';

		const select = document.createElement('select');
		select.className = 'products-filter-select';
		select.setAttribute('aria-label', 'Категории товаров');

		const optionAll = document.createElement('option');
		optionAll.value = '0';
		optionAll.textContent = 'All';
		select.appendChild(optionAll);

		categories.forEach(c => {
			const opt = document.createElement('option');
			opt.value = String(c.id);
			opt.textContent = c.name || String(c.id);
			select.appendChild(opt);
		});

		controlRow.appendChild(select);

		body.innerHTML = '';
		body.appendChild(controlRow);

		// product list container
		const listWrap = document.createElement('div');
		listWrap.id = 'productsListWrap';
		listWrap.className = 'products-table-wrap';
		body.appendChild(listWrap);

		async function loadProducts(categoryId) {
			try {
				const url = categoryId && categoryId !== '0' ? `http://localhost:5229/api/products/by-category/${categoryId}` : 'http://localhost:5229/api/products';
				const resp = await fetch(url);
				if (resp.ok) {
					const data = await resp.json();
					renderProductsTableTo(listWrap, data);
					return;
				}
			} catch (e) {
				// fallbacks to static data
			}
			// fallback: filter local dataset when a category is selected
			let filtered = productsFallback;
			if (categoryId && categoryId !== '0') {
				const cid = parseInt(categoryId, 10);
				filtered = productsFallback.filter(p => p.category_id === cid);
			}
			renderProductsTableTo(listWrap, filtered);
		}

		// wire filter changes using select
		select.addEventListener('change', () => {
			loadProducts(select.value);
		});

		// initial load
		loadProducts('0');
		modal.setAttribute('aria-hidden', 'false');
		modal.classList.add('signup_in--open');
		document.body.style.overflow = 'hidden';
		// wire close
		const closeBtn = modal.querySelector('.signup_in_close');
		const backdrop = modal.querySelector('.signup_in_backdrop');
		closeBtn?.addEventListener('click', () => closeProductsModal(modal));
		backdrop?.addEventListener('click', () => closeProductsModal(modal));
	}

	function closeProductsModal(modal) {
		modal.classList.remove('signup_in--open');
		modal.setAttribute('aria-hidden', 'true');
		// after CSS animation is finished ensure display none so the backdrop is removed
		setTimeout(() => {
			modal.style.display = 'none';
			document.body.style.overflow = '';
			// clean any dim overlays left behind
			document.querySelectorAll('.site-dim').forEach(el => el.parentNode?.removeChild(el));
		}, 280);
	}
	const modal = document.getElementById('siteModal');
	if (!modal) return;

	const backdrop = modal.querySelector('.signup_in_backdrop');
	const closeBtn = modal.querySelector('.signup_in_close');
	const closeables = [...modal.querySelectorAll('[data-modal-close]')];
	const panelSignup = modal.querySelector('.panel-signup');
	const panelLogin = modal.querySelector('.panel-login');
	const toggles = [...modal.querySelectorAll('.auth-toggle')];

	// auth form wiring - register / login
	const signupActionBtn = modal.querySelector('.signup-action');
	const loginActionBtn = modal.querySelector('.login-action');

	async function postJson(url, payload) {
		const resp = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
		return resp;
	}

	if (signupActionBtn) signupActionBtn.addEventListener('click', async () => {
		const form = signupActionBtn.closest('form');
		const email = form.querySelector('input[name="signup_email"]').value;
		const password = form.querySelector('input[name="signup_password"]').value;
		const resp = await postJson('http://localhost:5229/Auth/register', { email, password });
		if (resp.ok) {
			alert('Вы успешно зарегистрированы');
			setMode('login');
		} else {
			const data = await resp.json().catch(()=>({ message: 'Ошибка' }));
			alert('Ошибка регистрации: ' + (data?.message || resp.statusText));
		}
	});

	if (loginActionBtn) loginActionBtn.addEventListener('click', async () => {
		const form = loginActionBtn.closest('form');
		const email = form.querySelector('input[name="login_email"]').value;
		const password = form.querySelector('input[name="login_password"]').value;
		const resp = await postJson('http://localhost:5229/Auth/login', { email, password });
		if (resp.ok) {
			const data = await resp.json();
			localStorage.setItem('pf_token', data.token);
			localStorage.setItem('pf_email', data.email);
			alert('Вход выполнен');
			closeModal();
		} else {
			const data = await resp.json().catch(()=>({ message:'Ошибка' }));
			alert('Ошибка входа: ' + (data?.message || resp.statusText));
		}
	});

	let isClosing = false;
	function openModal() {
		if (modal.getAttribute('aria-hidden') === 'false') return;
		// ensure it's visible in the document flow before animating
		modal.style.display = 'flex';
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
			// remove from flow to avoid hidden overlay blocking clicks
			modal.style.display = 'none';
			document.body.style.overflow = '';
			openButton?.focus();
			isClosing = false;
		};
		dialog.addEventListener('transitionend', onEnd);
		// fallback in case transitionend doesn't fire
		setTimeout(() => {
			if (modal.getAttribute('aria-hidden') !== 'true') {
				modal.setAttribute('aria-hidden', 'true');
				modal.style.display = 'none';
				document.body.style.overflow = '';
				openButton?.focus();
				isClosing = false;
			}
		}, 400);

		// Also ensure other overlays removed (site-dim etc.)
		document.querySelectorAll('.site-dim').forEach(el => el.parentNode?.removeChild(el));
		// Hide any other modal overlays that might remain
		document.querySelectorAll('.signup_in').forEach(m => {
			if (m.getAttribute('aria-hidden') === 'true') {
				m.style.display = 'none';
				m.classList.remove('signup_in--open');
			}
		});
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

	// show logged in user on the button if available
	const token = localStorage.getItem('pf_token');
	const email = localStorage.getItem('pf_email');
	if (token && email) {
		openButton.textContent = `Выйти (${email})`;
	}

	// wiring
	openButton?.addEventListener('click', () => {
		// if logged in, make this button act as logout
		const tokenNow = localStorage.getItem('pf_token');
		const emailNow = localStorage.getItem('pf_email');
		if (tokenNow && emailNow) {
			if (confirm('Выйти из аккаунта?')) {
				localStorage.removeItem('pf_token');
				localStorage.removeItem('pf_email');
				openButton.textContent = 'Вход/Регистрация';
			}
			return;
		}
		setMode('signup'); openModal();
	});
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

	// wire catalog button (with debug logging)
	if (catalogButton) {
		catalogButton.addEventListener('click', (e) => {
			e.preventDefault();
			console.log('catalogButton clicked, opening products modal');
			openProductsModal();
		});
		console.log('catalogButton event wired');
	} else {
		console.warn('catalogButton not found - cannot wire products modal');
	}

	// SKU / article quick entry: save separately and navigate to datacheck.html
	const articleInput = document.getElementById('articleInput');
	if (articleInput) {
		articleInput.addEventListener('keyup', async (e) => {
			if (e.key === 'Enter') {
				const val = String(articleInput.value || '').trim();
				if (!val) {
					alert('Введите артикул');
					return;
				}
				const payload = { article: val };
				// Always save the submitted article and timestamp before attempting network request
				localStorage.setItem('pf_article', val);
				localStorage.setItem('pf_article_payload', JSON.stringify(payload));
				localStorage.setItem('pf_article_saved_at', new Date().toISOString());
				try {
					const resp = await fetch('http://localhost:5229/api/products/datacheck', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload)
					});
					let data = null;
					if (resp.ok) {
						data = await resp.json().catch(() => null);
					} else {
						// try to parse error body, but fall back to status info
						const errBody = await resp.json().catch(() => null);
						data = { error: true, status: resp.status, statusText: resp.statusText, body: errBody };
					}
					localStorage.setItem('pf_article_response', JSON.stringify(data));
				} catch (err) {
					console.error('Network error posting article', err);
					localStorage.setItem('pf_article_response', JSON.stringify({ error: true, message: String(err) }));
				}
				// Redirect in any case (success or error) as requested
				window.location.href = 'datacheck.html';
			}
		});
	} else {
		console.warn('articleInput not found - SKU quick-submit disabled');
	}

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
	});

	// start default
	setMode('signup');
});
