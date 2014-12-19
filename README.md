popover-js
==========

Mootools html hover popovers with features

```js
new Popover(htmlEl);
```

```js
(new Popover(htmlEl)).show()
```

```js
var p=new Popover(htmlEl);
p.setText('replace text');
p.show();
```

```js
var tip=new UIPopover(htmlEl, {anchor:AnchorTo(['bottom', 'top'])}); 
```

```js
//Example anchor function to be passed as {anchor:AnchorTo('top')}
var AnchorTo=function(sides, target){

  if((typeof sides)=='string')sides=[sides];
  //if sides is array with more than one item, then use first unless space is limited...

	return function(){

		var me=this;
		var sidesOpt=(sides||['bottom', 'top', 'left', 'right'])[0];
		
		var e=target||me.element;
		var c=me.tip;
		
		c.addClass(sidesOpt);
		c.addClass(({bottom:'arrow_top', top:'arrow_bottom', left:'arrow_right', right:'arrow_left'})[sidesOpt]);
		
		if(sidesOpt=='top'||sidesOpt=='bottom'){	
			var h=JSDOMUtilities.HorizontalAlign(c, e, 'center');	
			var v=JSDOMUtilities.VerticalAlign(c, e, sidesOpt, null, {offset:me.options.margin*(sidesOpt=='top'?-1:1)});	
			
			//JSConsoleInfo(['UIPopover Anchor {'+sidesOpt+'}',v, h]);
			
			me.options.offset.y+=v.offset;
			me.options.offset.x+=h.offset;
		}
		if(sidesOpt=='left'||sidesOpt=='right'){
			var v=JSDOMUtilities.VerticalAlign(c, e, 'center');
			var h=JSDOMUtilities.HorizontalAlign(c, e, sidesOpt, null,{offset:me.options.margin*(sidesOpt=='left'?-1:1)});	
			
			//JSConsoleInfo(['UIPopover Anchor {'+sidesOpt+'}',v, h]);
			
			me.options.offset.y+=v.offset;
			me.options.offset.x+=h.offset;
		}

	};
	
};
```
