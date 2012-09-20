function create_panel_for_dag(config) {

	var dag = config.dag;
	var dag_div_id = config.dag_div_id;
	var panel_div_id = config.panel_div_id;
	var features = config.features;
	
    var debugs = "nodes edges new_edges node_by_name".split(' ').map(function(x) {
        return new Ext.Action({ text: 'View Graph ' + x,
            handler: function() {
                ObjectBrowser.showInWindow(dag[x], x);
            }
        });
    });

    var layouts = "computeLayout1 computeLayout2 computeLayout3".split(' ').map(function(x) {
        return new Ext.Action({ text: x,
            handler: function() {
                var func = DagDrawer[x];
                dag.applyLayout( func(dag.nodes, dag.edges) );
                dag.center;
            }
        });
    });

    //var features = {"stateExpirationTime":365,"stateId":"DAG","stateful":true,"statePath":"/dag/example3"};

    // define the toolbar
    var toolbar = [
               {
                text: 'Debug',
                menu: debugs          // <-- Add the action directly to a menu
            },
            {
                text:'Layout',
                menu:layouts
            }
        ];

    //implements the stateful mechanism
    if ( features.stateful ) {

        var days = features.stateExpirationTime || 15;
        var cp = new Ext.state.CookieProvider({
            expires: new Date(new Date().getTime()+(1000*60*60*24*days)) // one year
            , path: features.statePath
        });
        Ext.state.Manager.setProvider(cp);


     // == add a reset state button
        toolbar.push({
            text:'Reset',
            tooltip:'Reset all user settings',

            handler: function() {
                Ext.state.Manager.clear(features.stateId);
                window.location.reload( false );
            }
        }, '-');
    }

    var panel = new Ext.Panel({
        title: userSettings.title || 'Dag Drawing',
        width: userSettings.width || 600,
        height: userSettings.height || 480,
        autoScroll:true,
        bodyStyle: 'padding:10px;'     // lazy inline style

        ,stateful: features.stateful
        ,stateId: features.stateId
        ,stateEvents: ['resize']
        ,tbar: toolbar

        ,contentEl: dag_div_id
        ,renderTo: panel_div_id

        ,getState: function() {

            var state = Ext.Panel.prototype.getState.call(this) || {};
            state.size = this.getSize();
            //log("getState", state);
            return state;
         }

         ,applyState: function(state) {
            //log("applyState", state);
            if( state.size)
                this.setSize(state.size);
         }

    });


    var basic = new Ext.Resizable('panel', {
            width:  panel.width,
            height: panel.height,
            pinned: true
    });

    basic.on('resize', function resizeg(obj,w,h,e)  {
            panel.setSize(w,h);
            panel.saveState();
        }
        , this );

    return panel;
}
