
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var drush=["28 pop Drush - Archers","32+2 pop Drush FC - Crossbows"];var fast_castle=["27+2 pop FC - Boom","28+2 pop FC - Knights","28+2 pop FC - Unique Unit","26+2 pop Arena FC"];var fast_imperial=["31+2+2 pop FI","Byzantine 28+2+2 pop FI"];var flush$1=["22 pop Scouts","23 pop Archers","22 pop Men-at-Arms - Archers","22 pop Men-at-Arms - Towers","Mongol 18-19 pop Scouts","Korean 19 pop Towers","22 pop Eagle Scouts"];var water=["26 pop Fire Galleys"];var index = {drush:drush,fast_castle:fast_castle,fast_imperial:fast_imperial,flush:flush$1,water:water};

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        drush: drush,
        fast_castle: fast_castle,
        fast_imperial: fast_imperial,
        flush: flush$1,
        water: water,
        'default': index
    });

    /* src/Menu.svelte generated by Svelte v3.25.0 */

    const { Object: Object_1 } = globals;
    const file = "src/Menu.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (78:6) {#each orders[1] as order}
    function create_each_block_1(ctx) {
    	let button;
    	let t0_value = /*order*/ ctx[9] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[5](/*order*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "build-order svelte-17sv9iq");
    			add_location(button, file, 78, 8, 1518);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(78:6) {#each orders[1] as order}",
    		ctx
    	});

    	return block;
    }

    // (68:0) {#each entries as orders}
    function create_each_block(ctx) {
    	let div1;
    	let button;
    	let t0_value = /*orders*/ ctx[6][0].toUpperCase().replace("_", " ") + "";
    	let t0;
    	let t1;
    	let div0;
    	let div0_class_value;
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*orders*/ ctx[6], ...args);
    	}

    	let each_value_1 = /*orders*/ ctx[6][1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "collapsible-btn svelte-17sv9iq");
    			add_location(button, file, 69, 4, 1213);

    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*expanded*/ ctx[1][/*orders*/ ctx[6][0]]
    			? "collapsible-shown"
    			: "collapsible-hidden") + " svelte-17sv9iq"));

    			add_location(div0, file, 75, 4, 1392);
    			attr_dev(div1, "class", "collapsible svelte-17sv9iq");
    			add_location(div1, file, 68, 2, 1183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(button, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*setBuildOrder, entries*/ 5) {
    				each_value_1 = /*orders*/ ctx[6][1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*expanded*/ 2 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*expanded*/ ctx[1][/*orders*/ ctx[6][0]]
    			? "collapsible-shown"
    			: "collapsible-hidden") + " svelte-17sv9iq"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(68:0) {#each entries as orders}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let each_1_anchor;
    	let each_value = /*entries*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*expanded, entries, setBuildOrder, toggleCollapsible*/ 15) {
    				each_value = /*entries*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	let { setBuildOrder } = $$props;
    	const entries = Object.entries(index$1);
    	const expanded = {};
    	entries.pop();

    	function toggleCollapsible(type) {
    		$$invalidate(1, expanded[type] = !expanded[type], expanded);
    	}

    	const writable_props = ["setBuildOrder"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = orders => toggleCollapsible(orders[0]);
    	const click_handler_1 = order => setBuildOrder(order);

    	$$self.$$set = $$props => {
    		if ("setBuildOrder" in $$props) $$invalidate(0, setBuildOrder = $$props.setBuildOrder);
    	};

    	$$self.$capture_state = () => ({
    		index: index$1,
    		setBuildOrder,
    		entries,
    		expanded,
    		toggleCollapsible
    	});

    	$$self.$inject_state = $$props => {
    		if ("setBuildOrder" in $$props) $$invalidate(0, setBuildOrder = $$props.setBuildOrder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		setBuildOrder,
    		expanded,
    		entries,
    		toggleCollapsible,
    		click_handler,
    		click_handler_1
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { setBuildOrder: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*setBuildOrder*/ ctx[0] === undefined && !("setBuildOrder" in props)) {
    			console.warn("<Menu> was created without expected prop 'setBuildOrder'");
    		}
    	}

    	get setBuildOrder() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set setBuildOrder(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ParseText.svelte generated by Svelte v3.25.0 */
    const file$1 = "src/ParseText.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (18:0) {:else}
    function create_else_block(ctx) {
    	let span;
    	let t_value = /*data*/ ctx[0].text + "";
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(/*data*/ ctx[0].class) + " svelte-cx2etd"));
    			add_location(span, file$1, 18, 2, 269);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*data*/ ctx[0].text + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty(/*data*/ ctx[0].class) + " svelte-cx2etd"))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:30) 
    function create_if_block_1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:30) ",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#if !data}
    function create_if_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			add_location(span, file$1, 12, 2, 158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:0) {#if !data}",
    		ctx
    	});

    	return block;
    }

    // (15:2) {#each data as sub}
    function create_each_block$1(ctx) {
    	let parsetext;
    	let current;

    	parsetext = new ParseText_1({
    			props: { data: /*sub*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(parsetext.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(parsetext, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const parsetext_changes = {};
    			if (dirty & /*data*/ 1) parsetext_changes.data = /*sub*/ ctx[1];
    			parsetext.$set(parsetext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(parsetext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(parsetext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(parsetext, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(15:2) {#each data as sub}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*data*/ ctx[0]) return 0;
    		if (dirty & /*data*/ 1) show_if = !!Array.isArray(/*data*/ ctx[0]);
    		if (show_if) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ParseText", slots, []);
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ParseText> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ ParseText: ParseText_1, data });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class ParseText_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ParseText_1",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<ParseText> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<ParseText>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ParseText>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/BuildOrder.svelte generated by Svelte v3.25.0 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "src/BuildOrder.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (166:2) {#each headers as header}
    function create_each_block_1$1(ctx) {
    	let th;
    	let t_value = /*header*/ ctx[10] + "";
    	let t;
    	let th_class_value;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "class", th_class_value = "" + (/*header*/ ctx[10].replace("/", "") + "-col" + " svelte-1pybigc"));
    			add_location(th, file$2, 166, 4, 3011);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(166:2) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    // (176:6) {:else}
    function create_else_block$1(ctx) {
    	let td0;
    	let parsetext0;
    	let td0_class_value;
    	let t0;
    	let td1;
    	let parsetext1;
    	let td1_class_value;
    	let t1;
    	let td2;
    	let parsetext2;
    	let td2_class_value;
    	let t2;
    	let td3;
    	let parsetext3;
    	let td3_class_value;
    	let t3;
    	let td4;
    	let parsetext4;
    	let td4_class_value;
    	let t4;
    	let td5;
    	let parsetext5;
    	let td5_class_value;
    	let t5;
    	let td6;
    	let parsetext6;
    	let td6_class_value;
    	let current;

    	parsetext0 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][0] },
    			$$inline: true
    		});

    	parsetext1 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][1] },
    			$$inline: true
    		});

    	parsetext2 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][2] },
    			$$inline: true
    		});

    	parsetext3 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][3] },
    			$$inline: true
    		});

    	parsetext4 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][4] },
    			$$inline: true
    		});

    	parsetext5 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][5] },
    			$$inline: true
    		});

    	parsetext6 = new ParseText_1({
    			props: { data: /*row*/ ctx[7][6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			create_component(parsetext0.$$.fragment);
    			t0 = space();
    			td1 = element("td");
    			create_component(parsetext1.$$.fragment);
    			t1 = space();
    			td2 = element("td");
    			create_component(parsetext2.$$.fragment);
    			t2 = space();
    			td3 = element("td");
    			create_component(parsetext3.$$.fragment);
    			t3 = space();
    			td4 = element("td");
    			create_component(parsetext4.$$.fragment);
    			t4 = space();
    			td5 = element("td");
    			create_component(parsetext5.$$.fragment);
    			t5 = space();
    			td6 = element("td");
    			create_component(parsetext6.$$.fragment);
    			attr_dev(td0, "class", td0_class_value = "build-col " + /*checkForBuildCell*/ ctx[6](/*row*/ ctx[7]) + " svelte-1pybigc");
    			add_location(td0, file$2, 176, 8, 3259);
    			attr_dev(td1, "class", td1_class_value = "" + (/*headers*/ ctx[4][0].replace("/", "") + "-col " + " svelte-1pybigc"));
    			add_location(td1, file$2, 179, 8, 3367);
    			attr_dev(td2, "class", td2_class_value = "" + (/*headers*/ ctx[4][1] + "-col " + " svelte-1pybigc"));
    			add_location(td2, file$2, 182, 8, 3475);
    			attr_dev(td3, "class", td3_class_value = "" + (/*headers*/ ctx[4][2] + "-col " + " svelte-1pybigc"));
    			add_location(td3, file$2, 185, 8, 3566);
    			attr_dev(td4, "class", td4_class_value = "" + (/*headers*/ ctx[4][3] + "-col " + " svelte-1pybigc"));
    			add_location(td4, file$2, 188, 8, 3657);
    			attr_dev(td5, "class", td5_class_value = "" + (/*headers*/ ctx[4][4] + "-col " + " svelte-1pybigc"));
    			add_location(td5, file$2, 191, 8, 3748);
    			attr_dev(td6, "class", td6_class_value = "" + (/*headers*/ ctx[4][5] + "-col " + " svelte-1pybigc"));
    			add_location(td6, file$2, 194, 8, 3839);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			mount_component(parsetext0, td0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, td1, anchor);
    			mount_component(parsetext1, td1, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td2, anchor);
    			mount_component(parsetext2, td2, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, td3, anchor);
    			mount_component(parsetext3, td3, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td4, anchor);
    			mount_component(parsetext4, td4, null);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, td5, anchor);
    			mount_component(parsetext5, td5, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, td6, anchor);
    			mount_component(parsetext6, td6, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const parsetext0_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext0_changes.data = /*row*/ ctx[7][0];
    			parsetext0.$set(parsetext0_changes);

    			if (!current || dirty & /*buildOrder*/ 1 && td0_class_value !== (td0_class_value = "build-col " + /*checkForBuildCell*/ ctx[6](/*row*/ ctx[7]) + " svelte-1pybigc")) {
    				attr_dev(td0, "class", td0_class_value);
    			}

    			const parsetext1_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext1_changes.data = /*row*/ ctx[7][1];
    			parsetext1.$set(parsetext1_changes);
    			const parsetext2_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext2_changes.data = /*row*/ ctx[7][2];
    			parsetext2.$set(parsetext2_changes);
    			const parsetext3_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext3_changes.data = /*row*/ ctx[7][3];
    			parsetext3.$set(parsetext3_changes);
    			const parsetext4_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext4_changes.data = /*row*/ ctx[7][4];
    			parsetext4.$set(parsetext4_changes);
    			const parsetext5_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext5_changes.data = /*row*/ ctx[7][5];
    			parsetext5.$set(parsetext5_changes);
    			const parsetext6_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext6_changes.data = /*row*/ ctx[7][6];
    			parsetext6.$set(parsetext6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(parsetext0.$$.fragment, local);
    			transition_in(parsetext1.$$.fragment, local);
    			transition_in(parsetext2.$$.fragment, local);
    			transition_in(parsetext3.$$.fragment, local);
    			transition_in(parsetext4.$$.fragment, local);
    			transition_in(parsetext5.$$.fragment, local);
    			transition_in(parsetext6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(parsetext0.$$.fragment, local);
    			transition_out(parsetext1.$$.fragment, local);
    			transition_out(parsetext2.$$.fragment, local);
    			transition_out(parsetext3.$$.fragment, local);
    			transition_out(parsetext4.$$.fragment, local);
    			transition_out(parsetext5.$$.fragment, local);
    			transition_out(parsetext6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			destroy_component(parsetext0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(td1);
    			destroy_component(parsetext1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td2);
    			destroy_component(parsetext2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(td3);
    			destroy_component(parsetext3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td4);
    			destroy_component(parsetext4);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(td5);
    			destroy_component(parsetext5);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(td6);
    			destroy_component(parsetext6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(176:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (172:6) {#if ageRow(row)}
    function create_if_block$1(ctx) {
    	let td;
    	let parsetext;
    	let current;

    	parsetext = new ParseText_1({
    			props: { data: /*row*/ ctx[7][0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			td = element("td");
    			create_component(parsetext.$$.fragment);
    			attr_dev(td, "colspan", "7");
    			attr_dev(td, "class", "age-row svelte-1pybigc");
    			add_location(td, file$2, 172, 8, 3152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			mount_component(parsetext, td, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const parsetext_changes = {};
    			if (dirty & /*buildOrder*/ 1) parsetext_changes.data = /*row*/ ctx[7][0];
    			parsetext.$set(parsetext_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(parsetext.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(parsetext.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			destroy_component(parsetext);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(172:6) {#if ageRow(row)}",
    		ctx
    	});

    	return block;
    }

    // (170:2) {#each buildOrder.rows as row}
    function create_each_block$2(ctx) {
    	let tr;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*buildOrder*/ 1) show_if = !!/*ageRow*/ ctx[5](/*row*/ ctx[7]);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			if_block.c();
    			t = space();
    			add_location(tr, file$2, 170, 4, 3115);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			if_blocks[current_block_type_index].m(tr, null);
    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(tr, t);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(170:2) {#each buildOrder.rows as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let button0;
    	let t0;
    	let t1_value = /*buildOrder*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let button1;
    	let t4;
    	let div1;
    	let t5_value = /*buildOrder*/ ctx[0].description + "";
    	let t5;
    	let div1_class_value;
    	let t6;
    	let table;
    	let th;
    	let t7;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*headers*/ ctx[4];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*buildOrder*/ ctx[0].rows;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			t0 = text("⇐ ");
    			t1 = text(t1_value);
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Description";
    			t4 = space();
    			div1 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			table = element("table");
    			th = element("th");
    			t7 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "title-btn svelte-1pybigc");
    			add_location(button0, file$2, 150, 2, 2566);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "description-toggle svelte-1pybigc");
    			add_location(button1, file$2, 154, 2, 2679);
    			attr_dev(div0, "class", "header svelte-1pybigc");
    			add_location(div0, file$2, 149, 0, 2543);

    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*displayDescription*/ ctx[2]
    			? "description-shown"
    			: "description-hidden") + " svelte-1pybigc"));

    			add_location(div1, file$2, 159, 0, 2794);
    			set_style(th, "background-color", "rgb(39, 39, 39)", 1);
    			attr_dev(th, "class", "svelte-1pybigc");
    			add_location(th, file$2, 164, 2, 2917);
    			attr_dev(table, "class", "svelte-1pybigc");
    			add_location(table, file$2, 163, 0, 2907);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, t0);
    			append_dev(button0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, th);
    			append_dev(table, t7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table, null);
    			}

    			append_dev(table, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*clearBuildOrder*/ ctx[1])) /*clearBuildOrder*/ ctx[1].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*toggleDescription*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*buildOrder*/ 1) && t1_value !== (t1_value = /*buildOrder*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*buildOrder*/ 1) && t5_value !== (t5_value = /*buildOrder*/ ctx[0].description + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty & /*displayDescription*/ 4 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*displayDescription*/ ctx[2]
    			? "description-shown"
    			: "description-hidden") + " svelte-1pybigc"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*headers*/ 16) {
    				each_value_1 = /*headers*/ ctx[4];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(table, t8);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*buildOrder, ageRow, headers, checkForBuildCell*/ 113) {
    				each_value = /*buildOrder*/ ctx[0].rows;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BuildOrder", slots, []);
    	let { buildOrder } = $$props;
    	let { clearBuildOrder } = $$props;
    	let displayDescription = false;

    	function toggleDescription() {
    		$$invalidate(2, displayDescription = !displayDescription);
    	}

    	const headers = buildOrder.headers;

    	const ageRow = row => {
    		const count = Object.keys(row).length;

    		if (count === 1) {
    			const cls = row[0][0].class;
    			if (cls === "advancing_section" || cls === "age_section") return "age-row";
    		}

    		return "";
    	};

    	const checkForBuildCell = row => {
    		const count = Object.keys(row).length;

    		if (count === 1) {
    			return "build-cell";
    		}

    		return "";
    	};

    	const writable_props = ["buildOrder", "clearBuildOrder"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BuildOrder> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("buildOrder" in $$props) $$invalidate(0, buildOrder = $$props.buildOrder);
    		if ("clearBuildOrder" in $$props) $$invalidate(1, clearBuildOrder = $$props.clearBuildOrder);
    	};

    	$$self.$capture_state = () => ({
    		buildOrder,
    		clearBuildOrder,
    		ParseText: ParseText_1,
    		displayDescription,
    		toggleDescription,
    		headers,
    		ageRow,
    		checkForBuildCell
    	});

    	$$self.$inject_state = $$props => {
    		if ("buildOrder" in $$props) $$invalidate(0, buildOrder = $$props.buildOrder);
    		if ("clearBuildOrder" in $$props) $$invalidate(1, clearBuildOrder = $$props.clearBuildOrder);
    		if ("displayDescription" in $$props) $$invalidate(2, displayDescription = $$props.displayDescription);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		buildOrder,
    		clearBuildOrder,
    		displayDescription,
    		toggleDescription,
    		headers,
    		ageRow,
    		checkForBuildCell
    	];
    }

    class BuildOrder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { buildOrder: 0, clearBuildOrder: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildOrder",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*buildOrder*/ ctx[0] === undefined && !("buildOrder" in props)) {
    			console.warn("<BuildOrder> was created without expected prop 'buildOrder'");
    		}

    		if (/*clearBuildOrder*/ ctx[1] === undefined && !("clearBuildOrder" in props)) {
    			console.warn("<BuildOrder> was created without expected prop 'clearBuildOrder'");
    		}
    	}

    	get buildOrder() {
    		throw new Error("<BuildOrder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buildOrder(value) {
    		throw new Error("<BuildOrder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clearBuildOrder() {
    		throw new Error("<BuildOrder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clearBuildOrder(value) {
    		throw new Error("<BuildOrder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.25.0 */

    const { console: console_1 } = globals;
    const file$3 = "src/App.svelte";

    // (32:2) {:else}
    function create_else_block$2(ctx) {
    	let menu;
    	let current;

    	menu = new Menu({
    			props: { setBuildOrder: /*setBuildOrder*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(32:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if buildOrder}
    function create_if_block$2(ctx) {
    	let buildorder;
    	let current;

    	buildorder = new BuildOrder({
    			props: {
    				buildOrder: /*buildOrder*/ ctx[0],
    				clearBuildOrder: /*clearBuildOrder*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(buildorder.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buildorder, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const buildorder_changes = {};
    			if (dirty & /*buildOrder*/ 1) buildorder_changes.buildOrder = /*buildOrder*/ ctx[0];
    			buildorder.$set(buildorder_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buildorder.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buildorder.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buildorder, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(30:2) {#if buildOrder}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*buildOrder*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-5li0bo");
    			add_location(main, file$3, 28, 0, 501);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let buildOrder = null;

    	const setBuildOrder = order => {
    		fetch(`json/build_orders/${order}.json`).then(res => res.json()).then(data => {
    			$$invalidate(0, buildOrder = data);
    		}).catch(err => console.error(err));
    	};

    	const clearBuildOrder = () => {
    		$$invalidate(0, buildOrder = null);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Menu,
    		BuildOrder,
    		buildOrder,
    		setBuildOrder,
    		clearBuildOrder
    	});

    	$$self.$inject_state = $$props => {
    		if ("buildOrder" in $$props) $$invalidate(0, buildOrder = $$props.buildOrder);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [buildOrder, setBuildOrder, clearBuildOrder];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
