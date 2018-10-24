Object.prototype.forEach = function (fn) {
    Object.keys(this).forEach((key) => fn(this[key], key));
}

Element.prototype.fadeIn = function (timing = 400, callback) {
    if (timing == "fast") timing = 200;
    if (timing == "slow") timing = 600;
    let start = null;
    const animateFrame = timestamp => {
        if (!start) start = timestamp;
        let progress = timestamp - start;
        let inc = ((timing - progress) / timing);
        let inc2 = 1 - inc;
        this.style.opacity = inc2;
        if (progress <= timing) {
            window.requestAnimationFrame(animateFrame);
        } else {
            this.style.opacity = 1;
            if (typeof callback === "function") callback(this)
        }
    }
    if(this.style.opacity < 1) {
        window.requestAnimationFrame(animateFrame);
    } else {
        if (typeof callback === "function") callback(this)
    }
    return this;
}

Element.prototype.fadeOut = function (timing = 400, callback) {
    if (timing == "fast") timing = 200;
    if (timing == "slow") timing = 600;
    let start = null;
    const animateFrame = timestamp => {
        if (!start) start = timestamp;
        let progress = timestamp - start;
        let inc = ((timing - progress) / timing);
        // let inc2 = 1 - inc;
        this.style.opacity = inc;
        if (progress <= timing) {
            window.requestAnimationFrame(animateFrame);
        } else {
            this.style.opacity = 0;
            if (typeof callback === "function") {
                callback(this)
            }
        }
    }
    window.requestAnimationFrame(animateFrame);
    return this;
}

Element.prototype.destroy = function () {
    this.parentNode.removeChild(this);
}



HTMLDialogElement.prototype.show = function(timing="fast", callback) {
    if(!this.open) {
        this.showModal();
        // this.hide();
        this.fadeIn(timing, callback);
    } else {
        this.fadeIn(timing, callback);
    }
    return this;
}

HTMLDialogElement.prototype.hide = function(timing="fast", callback) {
    this.fadeOut(timing, () => {
        this.close();
        if(typeof callback === "function") callback();
    })
    return this;
}

HTMLDialogElement.prototype.set = function(title, inner) {
    let header = this.querySelectorAll(".dialog-header");
    if(header.length >= 1 && title) {
        let orig = header[0].innerHTML;
        if(typeof title == "string") {
            header[0].innerHTML = title;
        } else {
            header[0].innerHTML = '';
            header[0].appendChild(title || orig);
        }
    }

    let body = this.querySelectorAll(".dialog-body");
    if(body.length >= 1 && inner) {
        let orig = body[0].innerHTML;
        if(typeof inner == "string") {
            body[0].innerHTML = inner;
        } else {
            body[0].innerHTML = '';
            body[0].appendChild(inner || orig);
        }
    }

    return this;
}

class ls {

    static _(n) {
        return this.select(n)[0];
    }

    static select(querySelector) {
        return document.querySelector(querySelector);
    }

    static clear(el) {
        el.innerHTML = '';
    }

    static create(type = 'div', inner, attributes) {
        let dom = document.createElement(type);
        if (inner != undefined) {
            if (inner instanceof HTMLElement) {
                dom.append(inner);
            } else if (typeof inner === 'object') {
                inner.forEach(el => dom.append(el))
            } else {
                dom.innerHTML = inner;
            }
        }
        if (attributes) {
            let attributeKeys = Object.keys(attributes);
            attributeKeys.forEach(attributeKey => {
                if (attributeKey.includes("bind:")) {
                    let eventName = attributeKey.split('bind:')[1];
                    dom.addEventListener(eventName, attributes[attributeKey])
                } else if (attributeKey === 'callback' || (attributeKey === 'action' && typeof attributes['action'] === 'function')) {
                    dom.addEventListener('submit', (e) => {
                        e.preventDefault();


                        const method = attributes['method'] || 'get';
                        const action = attributes['action'] || '/';

                        if(typeof action === 'function') {
                            action(e);
                        } else {
                            const data = new FormData(e.target);
                            if (method.toLowerCase() == 'post') {
                                this._POST(action, data, attributes[attributeKey]);
                            } else if (method.toLowerCase() == 'get') {
                                this._GET(action, data, attributes[attributeKey]);
                            } else if (method.toLowerCase() == 'post_json') {
                                this._POSTJSON(action, this.bodyToObject(data), attributes[attributeKey]);
                            }
                        }
                    }, true)
                } else {
                    dom.setAttribute(attributeKey, attributes[attributeKey]);
                }
            });
        }
        return dom;
    }

    static br() {
        return this.create('br')
    }

    static _POST(url, data, fn) {
        if (!(data instanceof FormData)) {
            data = this.objectToBody(data);
        }
        fetch(url, {
                body: data,
                method: 'POST'
            })
            .then(function (response) {
                return response.text();
            })
            .then(function (response) {
                if (typeof fn === "function") {
                    fn(response);
                }
            });
    }

    static _POSTJSON(url, data, fn) {
        fetch(url, {
                body: JSON.stringify(data),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (response) {
                if (typeof fn === "function") {
                    fn(response);
                }
            });
    }

    static _GET(url, data, fn) {
        if (typeof data === 'object') {
            url += '?' + this.serialize(data);
        } else if (typeof data === 'function') {
            fn = data;
        }
        fetch(url)
            .then(function (response) {
                return response.text();
            })
            .then(function (response) {
                if (typeof fn === "function") {
                    fn(response);
                }
            });
    }

    static convert(html) {
        const el = {
            type: 'span',
            inner: false,
            attributes: {}
        }
        // console.log(html);
        if (typeof html === 'string') {
            let typesplit = html.split('<');
            typesplit = typesplit[1].trim();
            let attrsplit = typesplit.split('>')[0].split(" ");
            el.type = attrsplit.shift();

            attrsplit.forEach(attr => {
                let getattr = attr.split('=');
                if (getattr != '/') {
                    el.attributes[getattr[0]] = eval(getattr[1]);
                }
            });
            let splitclose = '</' + el.type + '>';
            let innersplit = html.split(splitclose);
            innersplit.pop();
            innersplit = innersplit.join(splitclose).split('>');
            innersplit.shift();
            if (innersplit.length > 1) {
                el.inner = [];
                for (let i = 1; i < innersplit.length; i += 2) {
                    let innerjoin = innersplit[i - 1] + '>' + innersplit[i] + '>';
                    el.inner.push(this.convert(innerjoin));
                }
            } else {
                el.inner = this.convert(innersplit);
            }
        } else {
            el.inner = html[0];
        }
        return this.create(el.type, el.inner, el.attributes);
    }

    static serialize(object) {
        const keyvals = [];
        object.forEach((val, key) => keyvals.push(key + '=' + encodeURI(val)))
        return keyvals.join('&');
    }

    static formToBody(form, fields) {
        let body;
        if (!fields) {
            body = new FormData(form);
        } else {
            body = new FormData();
            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];
                body.append(field, form[field].value);
            }
        }
        return body;
    }

    static objectToBody(object) {
        const body = new FormData();
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            body.append(key, object[key]);
        }
        return body;
    }

    static bodyToFormValues(body, form) {
        if (body) {
            for (let key of body.keys()) {
                form.querySelectorAll(`*[name=${key}]`).value = body.get(key);
            }
        }
        return form;
    }

    static bodyToObject(body) {
        let obj = {};
        if (body) {
            for (let key of body.keys()) {
                obj[key] = body.get(key);
            }
        }
        return obj;
    }

    static renderTable(root=false, data, displayed=false, sortable = false, currentSort) {
        if(!displayed) {
            display = Object.keys(data[0]);
        }

        if (sortable) {
            if(!currentSort) {
                currentSort = {
                    type: display[0],
                    order: 'desc'
                };
            }
        }

        const sortColumn = (e, type) => {
            const target = e.target;
            if (type === currentSort.type) {
                currentSort.order = currentSort.order == 'desc' ? 'asc' : 'desc';
            } else {
                currentSort.type = type;
                currentSort.order = 'desc';
            }

            if(root && sortable) {
                ls.clear(root);
                root.append(ls.renderTable(root, users, displayed, sortable, currentSort));
            }
        }



        const head = ls.create('thead',
            ls.create('tr',
                Object.keys(data[0]).filter(item => {
                    return displayed.indexOf(item) > -1
                })
                .map(headItem => {
                    const order = sortable ? (currentSort.type == headItem ? currentSort.order : 'none') :
                        undefined;
                    return ls.create('th', headItem, {
                        order,
                        'bind:click': (e) => order ? sortColumn(e, headItem) : undefined
                    })
                })
            )
        );


        const body = ls.create('tbody',
            data.map(bodyItem => {
                return ls.create('tr', Object.keys(bodyItem).filter(item => {
                    return displayed.indexOf(item) > -1
                }).map(bodyData => {
                    let row;
                    if (bodyData === "date_created") {
                        let d = new Date(bodyItem[bodyData].date);
                        row = `${d.toLocaleDateString()} - ${d.toLocaleTimeString()}`;
                    } else {
                        row = bodyItem[bodyData];
                    }

                    return ls.create('td', row);
                }))
            })
        );

        const table = ls.create('table', [head, body]);
        return table;
    }

    static mount(root, fn, params) {
        let elem;
        ls.clear(root);
        if(fn) {
            if(params) {
                params.unshift(root);
                elem = fn.apply(null, params);
            } else {
                elem = fn();
            }
        } else {
            elem = fn;
        }
        root.append(elem);
    }

    static route(root, routes) {
        const routeNames = Object.keys(routes);
        routeNames.forEach(routeName => this.mount(root, routes[routeName]()))
    }

    static dialog(title, inner) {
        let closebutton = this.create('button', 'x', {
            class: 'dialog-close',
            'bind:click': e => dialog.hide()
        });
        let dialog = this.create('dialog', [
            closebutton,
            this.create('h2', title || [], {class: "dialog-header"}),
            this.create('div', inner || [], {class: "dialog-body"})
        ], {class: "dialog"});
        document.body.append(dialog);
        return dialog;
    }

    static params(n) {
        if(n) {
            let p;
            if(typeof n === "object") {
                p = new URLSearchParams();
                const k = Object.keys(n);
                for(let k = 0; k < k.length; i++) {
                    p.set(k[i], n[k[i]]);
                }
                return p.toString();
            } else {
                return new URLSearchParams(n);
            }
        } else {
            return new URLSearchParams(document.location.search);
        }
    }

    static newel(type, args) {
        const attrs = {};
        const inner = [];
        args.forEach((arg, i) => {
            if (i == 0) {
                let attrs_split = arg.split('-+-');
                for (let x = 0; x < attrs_split.length; x++) {
                    let attr_split = attrs_split[x].split('##');
                    if (attr_split[0].includes('bind:') || attr_split[0] == 'callback') {
                        attr_split[1] = eval(attr_split[1]);
                    }
                    attrs[attr_split[0]] = attr_split[1];
                }
            } else {
                inner.push(arg);
            }
        });
        return this.create(type, inner, attrs);
    }


    static form() {
        return this.newel('form', arguments);
    }
    static input() {
        return this.newel('input', arguments);
    }
    static textarea() {
        return this.newel('textarea', arguments);
    }
    static button() {
        return this.newel('button', arguments);
    }
    static br() {
        return this.create('br');
    }

}