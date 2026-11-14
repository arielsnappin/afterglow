/* @ds-bundle: {"format":4,"namespace":"Afterglow","components":[{"name":"Button"},{"name":"RsvpPicker"},{"name":"GlassCard"},{"name":"EventCard"},{"name":"AvatarStack"},{"name":"Sticker"},{"name":"TextField"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }
  var TONES = ['pop', 'zap', 'sun', 'sky', 'grape'];

  function Button(p) {
    var variant = p.variant || 'primary';
    var size = p.size || 'md';
    var rest = omit(p, ['variant', 'size', 'block', 'icon', 'className', 'children']);
    return h('button', Object.assign({ type: 'button' }, rest, {
      className: cx('ag-btn', 'ag-btn--' + variant, size !== 'md' && 'ag-btn--' + size, p.block && 'ag-btn--block', p.className)
    }),
      p.icon ? h('span', { className: 'ag-btn__icon', 'aria-hidden': true }, p.icon) : null,
      h('span', null, p.children)
    );
  }

  var RSVP_DEFAULT = [
    { id: 'going', emoji: '🎉', label: 'Going' },
    { id: 'maybe', emoji: '🤔', label: 'Maybe' },
    { id: 'cant', emoji: '😢', label: "Can't go" }
  ];
  function RsvpPicker(p) {
    var opts = p.options || RSVP_DEFAULT;
    var st = React.useState(p.defaultValue == null ? null : p.defaultValue);
    var value = p.value !== undefined ? p.value : st[0];
    return h('div', { className: cx('ag-rsvp', p.className), role: 'radiogroup', 'aria-label': p.label || 'RSVP' },
      opts.map(function (o) {
        var on = value === o.id;
        return h('button', {
          key: o.id, type: 'button', role: 'radio', 'aria-checked': on,
          className: cx('ag-rsvp__opt', 'ag-rsvp__opt--' + o.id, on && 'is-on'),
          onClick: function () { st[1](o.id); if (p.onChange) p.onChange(o.id); }
        },
          h('span', { className: 'ag-rsvp__emoji', 'aria-hidden': true }, o.emoji),
          h('span', null, o.label)
        );
      })
    );
  }

  function GlassCard(p) {
    var rest = omit(p, ['compact', 'tone', 'slab', 'className', 'children', 'as']);
    return h(p.as || 'div', Object.assign({}, rest, {
      className: cx('ag-glass', p.compact && 'ag-glass--compact', p.tone && 'ag-block ag-block--' + p.tone, p.tone && p.slab && 'ag-block--slab', p.className)
    }), p.children);
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).map(function (s) { return s.charAt(0); }).slice(0, 2).join('').toUpperCase();
  }
  function AvatarStack(p) {
    var people = p.people || [];
    var max = p.max || 4;
    var shown = people.slice(0, max);
    var extra = (p.total != null ? p.total : people.length) - shown.length;
    return h('div', { className: cx('ag-avs', 'ag-avs--' + (p.size || 'md'), p.className) },
      shown.map(function (x, i) {
        return h('span', { key: i, className: 'ag-av ag-av--' + (x.tone || TONES[i % TONES.length]), title: x.name }, initials(x.name));
      }),
      extra > 0 ? h('span', { className: 'ag-av ag-av--more' }, '+' + extra) : null,
      p.caption ? h('span', { className: 'ag-avs__cap' }, p.caption) : null
    );
  }

  function Sticker(p) {
    var tilt = p.tilt == null ? -4 : p.tilt;
    return h('span', { className: cx('ag-sticker', 'ag-sticker--' + (p.tone || 'zap'), p.className), style: { transform: 'rotate(' + tilt + 'deg)' } }, p.children);
  }

  var fieldCount = 0;
  function TextField(p) {
    var autoId = React.useMemo(function () { fieldCount += 1; return 'ag-field-' + fieldCount; }, []);
    var id = p.id || autoId;
    var rest = omit(p, ['label', 'hint', 'error', 'multiline', 'className', 'id']);
    return h('div', { className: cx('ag-field', p.error && 'ag-field--error', p.className) },
      p.label ? h('label', { className: 'ag-field__label', htmlFor: id }, p.label) : null,
      h(p.multiline ? 'textarea' : 'input', Object.assign({ id: id, className: 'ag-field__input', rows: p.multiline ? 3 : undefined, 'aria-invalid': p.error ? true : undefined }, rest)),
      (p.error || p.hint) ? h('span', { className: 'ag-field__hint' }, p.error || p.hint) : null
    );
  }

  function EventCard(p) {
    var tone = p.tone || 'pop';
    var going = p.going || [];
    return h('article', { className: cx('ag-event', p.className) },
      h('div', { className: 'ag-event__poster ag-event__poster--' + tone },
        p.emoji ? h('span', { className: 'ag-event__emoji', 'aria-hidden': true }, p.emoji) : null,
        p.sticker ? h(Sticker, { tone: p.stickerTone || (tone === 'zap' ? 'sun' : 'zap'), tilt: 6 }, p.sticker) : null
      ),
      h('div', { className: 'ag-event__body' },
        h('h3', { className: 'ag-event__title' }, p.title),
        (p.date || p.time) ? h('p', { className: 'ag-event__meta' }, [p.date, p.time].filter(Boolean).join(' · ')) : null,
        p.location ? h('p', { className: 'ag-event__meta ag-event__meta--muted' }, p.location) : null,
        p.host ? h('p', { className: 'ag-event__host' }, 'Hosted by ', h('strong', null, p.host)) : null,
        going.length ? h(AvatarStack, { people: going, total: p.goingCount, max: 4, size: 'sm', caption: (p.goingCount || going.length) + ' going' }) : null,
        p.children ? h('div', { className: 'ag-event__actions' }, p.children) : null
      )
    );
  }

  window.Afterglow = Object.assign(window.Afterglow || {}, {
    Button: Button, RsvpPicker: RsvpPicker, GlassCard: GlassCard, EventCard: EventCard,
    AvatarStack: AvatarStack, Sticker: Sticker, TextField: TextField
  });
})();
