// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Some Model
  // ----------

  // Our basic **SomeModel** model has `order`, and `someDefaultProp` attributes.
  // Other attributes 
  window.SomeModel = Backbone.Model.extend({

    // Default attributes for a todo item. Used when .create() is called
    defaults: function() {
      return {
        someDefaultProp:  false,
        order: SomeCollection.nextOrder()
      };
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // 2. Some Collection
  // ---------------

  window.SomeList = Backbone.Collection.extend({

    //2.1. Reference to this collection's model.
    model: SomeModel,

    //2.2 Filtering functions
    // Filter down the list of all todo items that are finished.
    withProperty: function(prop) {
      return this.filter(function(model){ return model.get(prop); });
    },

    // Filter down the list to only todo items that are still not finished.
    withoutProperty: function(prop) {
      return this.without.apply(this, this.withPoperty(prop));
    },

    // Clever version of filtering
    filterForProperty : function(prop, has){
      var self = this;
      return this.filter(function(model) {
        if (has){
          return model.get(prop);
        } else {
          return self.without.apply(self, self.filterForProperty(prop, true));
        }
      });
    },

    // 2.3 What 'order' should a newly added object have?
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    }

  });

  // Create our global collection of **SomeModel**.
  window.SomeCollection = new SomeList;

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  window.TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .check"              : "toggleDone",
      "dblclick div.todo-text"    : "edit",
      "click span.todo-destroy"   : "clear",
      "keypress .todo-input"      : "updateOnEnter"
    },

    // The TodoView listens for changes to its model, re-rendering.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the todo item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the todo item.
    setText: function() {
      var text = this.model.get('text');
      this.$('.todo-text').text(text);
      this.input = this.$('.todo-input');
      this.input.bind('blur', _.bind(this.close, this)).val(text);
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
      this.model.save({text: this.input.val()});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // 1. Define the 'top-level' UI Element 
  window.AppView = Backbone.View.extend({

    //1.1 Instead of generating a new element, bind to the existing skeleton of the App already present in the HTML.
    el: $("#app-container"),

    //1.2 this is a function that takes 'locals' and returns html  
    //the template is within a <script> w/ id some-template
    someTemplate: _.template($('#some-template').html()),

    //1.3 Assign dom-events from within this.el to local functions
    events: {
      "keypress #some-id":  "doOnKeypress", //jquery style selectors
      "click .some-class a": "doOnClick"
    },
    
    //1.3.a Define the dom event reaction fn
    doOnClick : function(){
      //do something in the view eg:
      var changeThis = this.$("#some-element-to-change");
      changeThis.text('some new text');
    },

    // 1.4. Bind to external events && assign any UI frequently used UI elements
    initialize: function() {
      this.freqUsedEl    = this.$("#freq-used-el");

      SomeCollection.bind('add',   this.addOne, this); // one item was added
      SomeCollection.bind('reset', this.addAll, this); // collection was totally replaced
      SomeCollection.bind('all',   this.render, this); // any event fired by this coll

      SomeCollection.fetch();
    },

    //1.4.a Render a single model (a member of SomeCollection) by calling new SomeView
    // and append it to #some-list
    addOne: function(model) {
      var view = new SomeView({model: model});
      // appending a 'rendered' chunk of HTML to be appended to the DOM
      $("#some-list").append(view.render().el);
    },

    //1.4.b Iteratively do 1.4.a (add all items at once)
    addAll: function() {
      SomeCollection.each(this.addOne);
    },

    // 1.5 Must define the render function : all the parts of this view that 
    // depend on data to render
    render: function() {
      this.$('#some-container').html(this.someTemplate({
        var1: SomeCollection.length,
        var2: SomeCollection.someProp,
        var3: SomeCollection.someVal()
      }));
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.App = new AppView;

});
