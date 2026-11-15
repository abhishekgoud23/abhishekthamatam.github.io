/* Abhishek Thamatam — cinematic portfolio interactions (no dependencies) */
(function () {
	"use strict";

	var doc = document, body = doc.body, root = doc.documentElement;
	var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = window.matchMedia("(pointer: fine)").matches;
	var $ = function (s, c) { return (c || doc).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

	/* ---------- Split titles into maskable lines ---------- */
	$$(".split .line").forEach(function (line) {
		line.innerHTML = "<span>" + line.innerHTML + "</span>";
	});

	/* ---------- Opening titles ---------- */
	var countEl = $("[data-preload-count]");
	var start = performance.now();
	var minDur = reduce ? 0 : 1700;
	var loaded = false;
	window.addEventListener("load", function () { loaded = true; });

	function tickPreload(now) {
		var t = Math.min(1, (now - start) / Math.max(minDur, 1));
		var target = loaded ? t : Math.min(t, 0.9);
		if (countEl) countEl.textContent = Math.round(easeOut(target) * 100);
		if (target >= 1 || now - start > 4500) { finishLoad(); return; }
		requestAnimationFrame(tickPreload);
	}
	function finishLoad() {
		if (body.classList.contains("is-loaded")) return;
		if (countEl) countEl.textContent = "100";
		body.classList.remove("is-loading");
		body.classList.add("is-loaded");
		setTimeout(function () { $$(".hero .split, .hero .reveal").forEach(show); }, reduce ? 0 : 650);
	}
	requestAnimationFrame(tickPreload);

	function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

	/* ---------- Reveal on scroll ---------- */
	function show(el) { el.classList.add("is-in"); }

	// stagger siblings inside grids
	[".stats", ".projects", ".skills", ".certs", ".vol", ".finale__items", ".edu__grid", ".about__body"].forEach(function (sel) {
		$$(sel).forEach(function (wrap) {
			$$(":scope > .reveal", wrap).forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 0.09 + "s"); });
		});
	});

	var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
		entries.forEach(function (e) {
			if (e.isIntersecting) {
				show(e.target);
				if (e.target.hasAttribute("data-count")) countUp(e.target);
				io.unobserve(e.target);
			}
		});
	}, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }) : null;

	$$(".reveal, .split, [data-count]").forEach(function (el) {
		if (el.closest(".hero")) return; // hero handled after opening titles
		if (io) io.observe(el); else { show(el); if (el.hasAttribute("data-count")) countUp(el); }
	});

	/* ---------- Counters ---------- */
	function countUp(el) {
		var end = parseFloat(el.getAttribute("data-count"));
		var suffix = el.getAttribute("data-suffix") || "";
		if (reduce) { el.textContent = end + suffix; return; }
		var t0 = performance.now(), dur = 1800;
		(function step(now) {
			var p = Math.min(1, (now - t0) / dur);
			el.textContent = Math.round(end * easeOut(p)) + suffix;
			if (p < 1) requestAnimationFrame(step);
		})(t0);
	}

	/* ---------- Role rotator ---------- */
	var words = $$(".rotator__word");
	if (words.length > 1 && !reduce) {
		var wi = 0;
		setInterval(function () {
			var cur = words[wi];
			cur.classList.remove("is-active"); cur.classList.add("is-leaving");
			setTimeout(function () { cur.classList.remove("is-leaving"); }, 700);
			wi = (wi + 1) % words.length;
			words[wi].classList.add("is-active");
		}, 2800);
	}

	/* ---------- Scroll-driven: progress, nav, parallax, timeline ---------- */
	var nav = $(".nav"), bar = $(".progress span"), timeline = $(".timeline");
	var parallax = $$("[data-speed]");
	var ticking = false;

	function onScroll() {
		var y = window.scrollY, h = root.scrollHeight - window.innerHeight;
		if (bar) bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
		if (nav) nav.classList.toggle("is-scrolled", y > 40);

		if (!reduce) {
			parallax.forEach(function (el) {
				var s = parseFloat(el.getAttribute("data-speed")) || 0;
				el.style.translate = "0 " + (y * s).toFixed(1) + "px";
			});
		}

		if (timeline) {
			var r = timeline.getBoundingClientRect();
			var p = (window.innerHeight * 0.6 - r.top) / r.height;
			timeline.style.setProperty("--tl", Math.max(0, Math.min(1, p)) * 100 + "%");
		}
		ticking = false;
	}
	window.addEventListener("scroll", function () {
		if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
	}, { passive: true });
	onScroll();

	/* ---------- Active chapter in nav ---------- */
	var links = $$(".nav__links a");
	if (io) {
		var navIO = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (!e.isIntersecting) return;
				links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id); });
			});
		}, { rootMargin: "-45% 0px -50% 0px" });
		links.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) navIO.observe(s); });
	}

	/* ---------- Mobile menu ---------- */
	var toggle = $(".nav__toggle");
	if (toggle) {
		toggle.addEventListener("click", function () {
			var open = nav.classList.toggle("is-open");
			toggle.setAttribute("aria-expanded", open);
			body.style.overflow = open ? "hidden" : "";
		});
		links.forEach(function (a) {
			a.addEventListener("click", function () {
				nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); body.style.overflow = "";
			});
		});
	}

	/* ---------- Project filter ---------- */
	var filterBtns = $$(".filters button"), projects = $$(".project");
	filterBtns.forEach(function (btn) {
		btn.addEventListener("click", function () {
			var f = btn.getAttribute("data-filter");
			filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
			projects.forEach(function (p) {
				var match = f === "all" || p.getAttribute("data-cat") === f;
				p.classList.toggle("is-hidden", !match);
				if (match) { p.classList.remove("is-in"); void p.offsetWidth; show(p); }
			});
		});
	});

	/* ---------- Pointer effects (desktop only) ---------- */
	if (finePointer && !reduce) {
		var glow = $(".cursor-glow"), gx = 0, gy = 0, cx = 0, cy = 0;
		window.addEventListener("pointermove", function (e) {
			gx = e.clientX; gy = e.clientY; body.classList.add("has-pointer");
		}, { passive: true });
		(function follow() {
			cx += (gx - cx) * 0.12; cy += (gy - cy) * 0.12;
			if (glow) glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
			requestAnimationFrame(follow);
		})();

		// spotlight inside cards
		$$(".project, .job__card").forEach(function (card) {
			card.addEventListener("pointermove", function (e) {
				var r = card.getBoundingClientRect();
				card.style.setProperty("--mx", e.clientX - r.left + "px");
				card.style.setProperty("--my", e.clientY - r.top + "px");
			});
		});

		// subtle tilt on project cards
		projects.forEach(function (card) {
			card.addEventListener("pointermove", function (e) {
				var r = card.getBoundingClientRect();
				var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
				card.style.transform = "perspective(900px) rotateX(" + (-py * 4) + "deg) rotateY(" + (px * 5) + "deg) translateY(-4px)";
			});
			card.addEventListener("pointerleave", function () { card.style.transform = ""; });
		});

		// magnetic buttons
		$$(".magnetic").forEach(function (el) {
			el.addEventListener("pointermove", function (e) {
				var r = el.getBoundingClientRect();
				var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
				el.style.transform = "translate(" + x * 0.25 + "px," + y * 0.35 + "px)";
			});
			el.addEventListener("pointerleave", function () { el.style.transform = ""; });
		});
	}

	/* ---------- Hero neural-net canvas ---------- */
	var canvas = $(".hero__net");
	if (canvas && canvas.getContext && !reduce) {
		var ctx = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
		var W, H, nodes = [], mouse = { x: -9999, y: -9999 }, running = true;
		var colors = ["244,184,96", "92,200,255", "155,140,255"];

		function resize() {
			W = canvas.clientWidth; H = canvas.clientHeight;
			canvas.width = W * dpr; canvas.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			var n = Math.round(Math.min(90, (W * H) / 16000));
			nodes = [];
			for (var i = 0; i < n; i++) {
				nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .6, c: colors[i % 3] });
			}
		}
		function draw() {
			if (!running) return;
			ctx.clearRect(0, 0, W, H);
			for (var i = 0; i < nodes.length; i++) {
				var a = nodes[i];
				a.x += a.vx; a.y += a.vy;
				if (a.x < 0 || a.x > W) a.vx *= -1;
				if (a.y < 0 || a.y > H) a.vy *= -1;
				var dxm = a.x - mouse.x, dym = a.y - mouse.y, dm = Math.sqrt(dxm * dxm + dym * dym);
				if (dm < 140) { a.x += dxm / dm * .6; a.y += dym / dm * .6; }
				for (var j = i + 1; j < nodes.length; j++) {
					var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
					if (d < 15000) {
						ctx.strokeStyle = "rgba(" + a.c + "," + (0.16 * (1 - d / 15000)).toFixed(3) + ")";
						ctx.lineWidth = .7;
						ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
					}
				}
				ctx.fillStyle = "rgba(" + a.c + ",.8)";
				ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
			}
			requestAnimationFrame(draw);
		}
		resize(); draw();
		window.addEventListener("resize", resize);
		canvas.parentElement.addEventListener("pointermove", function (e) {
			var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
		});
		canvas.parentElement.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
		// pause when hero is off-screen
		if (io) new IntersectionObserver(function (es) {
			var vis = es[0].isIntersecting;
			if (vis && !running) { running = true; draw(); } else if (!vis) running = false;
		}).observe(canvas);
	}

	/* ---------- Footer year ---------- */
	var yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
