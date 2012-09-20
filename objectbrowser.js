/**
 * @author kforner
 * @depends upon datadumper.js An object displayed as a tree
 *
 */

var ObjectBrowser = {  window:null,
		levelMax: 5,
		settings: {
			window: { width:500, height:400 },
			tree: { width:200  }
		}
};


ObjectBrowser._createWindow = function(tree, panel) {
	var ws = ObjectBrowser.settings.window;
	var win;
	win = new Ext.Window({
		title:'Object Browser',
       // applyTo : 'hello-win',
      // id:'ObjectBrowser-win',
        layout      : 'border',
        width       : ws.width,
        height      : ws.height,
        closeAction :'close',
        plain       : true,
        renderTo:Ext.getBody(),
        items: [tree, panel],
        buttons: [{
            text     : 'Close',
            handler  : function(){
                win.hide();
            }
        }]
    });
	return win;
};

ObjectBrowser._createTreePanel = function(root) {
	var wt = ObjectBrowser.settings.tree;
	var tree = new Ext.tree.TreePanel({
		  root:root
			// ,loader:new Ext.tree.TreeLoader({preloadChildren:true})
			,title:'Tree'
			,layout:'fit'
				,region:'west'
			,width:wt.width
			,split:true
			// ,collapsible:true
			,autoScroll:true
    });
	return tree;
};

ObjectBrowser.showInWindow = function(o, name) {

	var root = ObjectBrowser._buildTreeModel(o, name);

	//console.log( Dumper(root));

	var tree = ObjectBrowser._createTreePanel(root);
	var panel =  new Ext.Panel({
		 region:'center'
			 ,layout:'fit'
			 ,id:'target'
			 ,bodyStyle:'font-size:13px'
			,autoScroll: true

	});

	tree.on('click', function(node, e) {

		// not intuitive : the extra treenode attributes go
		// to node.attributes
	    var html = '<PRE>' + Dumper(node.attributes.data) + '</PRE>';

		panel.body.dom.innerHTML = html;
	    panel.doLayout();

	});

	var win = ObjectBrowser._createWindow(tree, panel);

	win.show();

};


// implement a level limit
ObjectBrowser._buildTreeModel = function(o, varName, level) {
	level = level || 0;

	if ( level > ObjectBrowser.levelMax ) {
		return { text: 'Too deep' };
	}

	varName = varName || 'root';


	var node = { data:o,   expanded: false};

	if ( typeof o == 'function') {
		node.text = 'function ' + varName;
		node.leaf = true;

	} else if ( typeof o == 'object') {


		if ( Ext.isArray(o) ) {
			node.text = 'array[' + o.length + ']' + ' - ' + varName;
		} else
			node.text = varName;

		var children = [];
		for (var p in o) {
			var child = ObjectBrowser._buildTreeModel(o[p], p, level + 1);
			children.push( child );
		}
		node.children = children;


	} else {
		node.text = varName + ':' + o;
		node.leaf = true;
	}


	return node;
}

