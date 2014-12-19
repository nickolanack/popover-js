/**
 * 
 */

var Popover = (function(){


	var _current=null; //static private variable keeps track of currently active (most recent) Popover
	var _visible=[]; //static private variable keeps track of currently active Popovers including _current 


	var Popover = new Class({
		Implements: Events,
		initialize:function(el, options) 
		{

			var e=$(typeOf(el)=='array'?el[0]:el);

			var me=this;
			me.element=e;

			me.options=Object.append({

				/*
				 * optional css id to apply to root element
				 */
				//id: null, 

				/*
				anchor function is used to position the popover. if set, 'offset' ignored and 'fixed' is set to true
				the anchor function should physically update the element position, and also update options.offset
				 */
				//anchor:function(){},

				/*
				 * if set to true and anchor function exists, then 'anchor' is called onShow events as well as on init
				 */
				movableTarget:false, 

				offset: {x: 16, y: 16}, 
				windowPadding: {x:0, y:0},

				waiAria: true,

				showDelay:0, // time to wait before opening
				hideDelay:0, // time to wait before closing
				
				// optional margin variable is not used internally but is available to anchor function 
				// if anchor exists. anchor function should align the popover with the target element, using margin (possibly negative)
				margin:0, 
				
				
				// not yet implemented, however it will be used to support popovers as small menues with clickable buttons
				// and hovering over the popover should allow the popover to stay open as well as provide mouse clicable items
				// this would be used with content (dom) element display instead of text.
				clickable:false,
				
				// pobably leave this alone, or add more names
				className: 'popover tip-wrap hoverable', 

				// if true will not follow mouse
				fixed:(options&&options.anchor?true:false),
				
				
				onHide: function(tip){
					tip.removeClass('hover');
				},
				onShow:function(tip){
					tip.setStyle('zIndex',9999999);
					//tip.setStyle('opacity',0);
					this.tip.setStyle('display', 'block');

					if(me.options.anchor){
						me.options.anchor.bind(me)();
					}

					Object.each(_visible, function(o){
						o.removeClass('hover');
					});

					_visible=[];
					_visible.push(tip);

					tip.addClass('hover');

					_visible=[tip];

				}
			}, options);

			me._storeContent();

			Array.each(['onShow', 'onHide'],function(event){
				if(me.options[event])me.addEvent(event,me.options[event]);
			});

			this._attach(me.element);

			this.container = new Element('div', {'class': 'tip'});
			if (this.options.id){
				this.container.set('id', this.options.id);
				if (this.options.waiAria) this._attachWaiAria();
			}

			/*
			 * sometimes tips wont leave so upon display, 
			 * this will:
			 *		clear the last tip if it is active.
			 *		set itself as active tip
			 *		clear self on exit unless it gets stuck,
			 *			 - otherwise next tip will clear it.
			 */
			me._addCleanupEvents();

		},

		_attachWaiAria: function(){
			var id = this.options.id;
			this.container.set('role', 'tooltip');

			if (!this.waiAria){
				this.waiAria = {
						show: function(element){
							if (id) element.set('aria-describedby', id);
							this.container.set('aria-hidden', 'false');
						},
						hide: function(element){
							if (id) element.erase('aria-describedby');
							this.container.set('aria-hidden', 'true');
						}
				};
			}
			this.addEvents(this.waiAria);
		},

		_detachWaiAria: function(){

			if (this.waiAria){
				this.container.erase('role');
				this.container.erase('aria-hidden');
				this.removeEvents(this.waiAria);
			}

		},

		_attach: function(elements){

			$$(elements).each(function(element){


				this.fireEvent('attach', [element]);

				var events = ['enter', 'leave'];
				if (!this.options.fixed) events.push('move');

				events.each(function(value){
					var event = element.retrieve('tip:' + value);
					if (!event) event = function(event){
						this['_event' + value.capitalize()].apply(this, [event, element]);
					}.bind(this);

					element.store('tip:' + value, event).addEvent('mouse' + value, event);

				}, this);
			}, this);

			return this;

		},

		detach: function(){
			var me=this;
			$$(me.element).each(function(element){
				['enter', 'leave', 'move'].each(function(value){
					element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
				});

				this.fireEvent('detach', [element]);

			}, this);
			me._detachWaiAria();
			return this;
		},



		_eventLeave:function(event, element){
			clearTimeout(this.timer);
			this.timer = this._hide.delay(this.options.hideDelay, this, element);
			this._fireForParent(event, element);
		},

		setTitle:function(title){
			var me=this;
			if (me._titleElement){
				me._titleElement.empty();
				me._fill(me._titleElement, title);
			}


			me.element.store('tip:title',title);
			me._position();
			return me;
		},

		setText: function(text){
			var me=this;
			if (me._textElement){
				me._textElement.empty();
				me._fill(me._textElement, text);
			}

			me.element.store('tip:text', text);


			me._position();
			return me;
		},

		_fireForParent: function(event, element){
			var me=this;
			element = element.getParent();
			if (!element || element == document.body) return;
			if (element.retrieve('tip:enter')) element.fireEvent('mouseenter', event);
			else me._fireForParent(event, element);
		},

		_eventMove: function(event, element){
			this._position(event);
		},

		_position: function(event){

			var me=this;
			if(me.options.anchor){

				if(me.options.movableTarget){
					me.options.anchor.bind(me)();
				}
				return;
			}

			if (!this.tip) document.id(this);

			var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			bounds = {y: false, x2: false, y2: false, x: false},
			obj = {};

			for (var z in props){
				obj[props[z]] = event.page[z] + this.options.offset[z];
				if (obj[props[z]] < 0) bounds[z] = true;
				if ((obj[props[z]] + tip[z] - scroll[z]) > size[z] - this.options.windowPadding[z]){
					obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
					bounds[z+'2'] = true;
				}
			}

			this.fireEvent('bound', bounds);
			this.tip.setStyles(obj);
		},

		_fill: function(element, contents){
			if (typeof contents == 'string') element.set('html', contents);
			else element.adopt(contents);
		},

		//	show: function(element){
		//		if (!this.tip) document.id(this);
		//		if (!this.tip.getParent()) this.tip.inject(document.body);
		//		this.fireEvent('show', [this.tip, element]);
		//		return me;
		//	},

		_hide: function(element){
			if (!this.tip) document.id(this);
			this.fireEvent('hide', [this.tip, element]);
		},



		end:function(){
			var me=this;
			this.hide();
			return me;
		},

		hide:function(){
			var me=this;
			try{
				this._hide();
			}catch(e){
				JSConsoleError(['UIPopover Hide Exception',e]);
				throw e;
			}		
			return me;
		},

		show:function(){
			var me=this;
			this._show(me.element);
			return me;
		},

		_show:function(element){

			this.container.empty();
			['title', 'text'].each(function(value){
				var content = element.retrieve('tip:' + value);
				var div = this['_' + value + 'Element'] = new Element('div', {
					'class': 'tip-' + value
				}).inject(this.container);
				if (content) this._fill(div, content);
			}, this);

			if (!this.tip) document.id(this);
			if (!this.tip.getParent()) this._inject();
			this.fireEvent('show', [this.tip, element]);

		},

		_inject:function(){
			this.tip.inject(document.body);
		},

		_eventEnter: function(event, element){

			clearTimeout(this.timer);
			this.timer = (function(){

				this._show(element);

				this._position((this.options.fixed) ? {page: element.getPosition()} : event);
			}).delay(this.options.showDelay, this);

		},

		_clickable:function(){

			var me=this;
			me.tip.addClass('clickable');
			me.tip.addEvent('click',function(){
				me.fireEvent('onClick');
			});

		},

		_storeContent:function(){
			var me=this;
			var e=me.element;

			var t="";
			var d="";

			e.store('tip:title',"");
			e.store('tip:text',"");

			if(me.options&&me.options.content){

				e.store('tip:text',me.options.content);

			}else if(me.options&&(me.options.title||me.options.description)){

				if(me.options.title){
					e.store('tip:title',me.options.title);
				}

				if(me.options.description){
					e.store('tip:text',me.options.description);
				}

			}else{

				if(e.title&&e.title.indexOf('::')){
					var t_=e.title;
					t=t_.split('::')[0];
					d=t_.split('::').slice(1).join('::');
					e.store('tip:title',t);
					e.store('tip:text',d);
					e.erase('title');

				}else if(e.title){
					$(e).store('tip:title',e.title);
				}
			}

		},

		toElement: function(){
			if (this.tip) return this.tip;

			this.tip = new Element('div', {
				'class': this.options.className,
				styles: {
					position: 'absolute',
					top: 0,
					left: 0
				}
			}).adopt(
					new Element('div', {'class': 'tip-top'}),
					this.container,
					new Element('div', {'class': 'tip-bottom'})
			);

			return this.tip;
		},

		_addCleanupEvents:function(){
			var me=this;
			me.addEvent("onShow",function(tip){
				tip.setStyle('zIndex',9999999);
				//alert('show');

				//_current is a private static variable shared by all Popovers

				if(_current)
				{
					if(_current!=me)
					{
						//alert('end');
						_current.end();
					}
				}
				else
				{
					_current=me;
				}
			});
			me.addEvent("onHide",function(){
				if(_current==me){
					_current=null;
				}	
			});

		},


		enable:function(){}, //will start responding to activation events
		disable:function(){} //will [close and] stop responding to activation events

	});


	return Popover;

})();
