/*global app, jasmine, describe, it, beforeEach, expect */

describe('controller', function () {
	'use strict';

	var subject, model, view;

	var setUpModel = function (todos) {
		model.read.and.callFake(function (query, callback) {
			callback = callback || query;
			callback(todos);
		});

		model.getCount.and.callFake(function (callback) {

			var todoCounts = {
				active: todos.filter(function (todo) {
					return !todo.completed;
				}).length,
				completed: todos.filter(function (todo) {
					return !!todo.completed;
				}).length,
				total: todos.length
			};

			callback(todoCounts);
		});

		model.remove.and.callFake(function (id, callback) {
			callback();
		});

		model.create.and.callFake(function (title, callback) {
			callback();
		});

		model.update.and.callFake(function (id, updateData, callback) {
			callback();
		});
	};

	var createViewStub = function () {
		var eventRegistry = {};
		return {
			render: jasmine.createSpy('render'),
			bind: function (event, handler) {
				eventRegistry[event] = handler;
			},
			trigger: function (event, parameter) {
				eventRegistry[event](parameter);
			}
		};
	};

	beforeEach(function () {
		model = jasmine.createSpyObj('model', ['read', 'getCount', 'remove', 'create', 'update']);
		view = createViewStub();
		subject = new app.Controller(model, view);
	});

	it('should show entries on start-up', function () {
    var todo = {title: 'my todo'};
    expect(todo).toBeDefined();
    setUpModel([todo]);
    subject.setView('');  //--If we tell the controller to set the view without options (completed, active)

   //--We expect the view to call "render" with the "showEntries" paramaters for displaying todos
    expect(view.render).toHaveBeenCalledWith('setFilter', '');
    expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
	});

	describe('routing', function () {

		it('should show all entries without a route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show all entries without "all" route', function () {
			var todo = {title: 'my todo'};
			setUpModel([todo]);

			subject.setView('#/');

			expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
		});

		it('should show active entries', function () {
      var todo = {title: 'my todo', active: true};
      setUpModel([todo]);

      //--If we tell the controller to set the view with the 'active' option
      subject.setView('#/active');

      //-- We expect the model to call "read" with "completed: false" parameter to go fetch uncompleted todos in db
      expect(model.read).toHaveBeenCalledWith({ completed: false}, jasmine.any(Function)); //--we expect a function as second parameters (callback)

      //--We expect the view to call "render" with the "showEntries" paramaters for displaying todos
      expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
    });

		it('should show completed entries', function () {
      //--Create a fake todo to be the model and set it to be completed
      var todo = {title: 'my todo', completed: true};
      setUpModel([todo]);

      //--If we tell the controller to set the view with the "completed" option
      subject.setView('#/completed');

      //-- We expect the model to call "read" with "completed: true" parameter to go fetch completed todos in db
      expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function)); //--we expect a function as second parameters (callback)

      //--We expect the view to call "render" with the "showEntries" paramaters for displaying todos
      expect(view.render).toHaveBeenCalledWith('showEntries', [todo]);
    });
  });

	it('should show the content block when todos exists', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: true
		});
	});

	it('should hide the content block when no todos exists', function () {
		setUpModel([]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('contentBlockVisibility', {
			visible: false
		});
	});

	it('should check the toggle all button, if all todos are completed', function () {
		setUpModel([{title: 'my todo', completed: true}]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('toggleAll', {
			checked: true
		});
	});

	it('should set the "clear completed" button', function () {
		var todo = {id: 42, title: 'my todo', completed: true};
		setUpModel([todo]);

		subject.setView('');

		expect(view.render).toHaveBeenCalledWith('clearCompletedButton', {
			completed: 1,
			visible: true
		});
	});

	it('should highlight "All" filter by default', function () {
    //-- if we set the view with no parameters
    subject.setView('');

    //-- We expect the view to call setFilter with no parameters (empty string) for targeting the All button (with qs)
    expect(view.render).toHaveBeenCalledWith('setFilter', '');
	});

	it('should highlight "Active" filter when switching to active view', function () {
    //-- if we set the view with the active parameter
    subject.setView('#/active');

    //-- We expect the view to call setFilter with "active" parameters for targeting the Active button (with qs)
    expect(view.render).toHaveBeenCalledWith('setFilter', 'active');
	});

	describe('toggle all', function () {
		it('should toggle all todos to completed', function () {
		//-- creating two todos for multiple "completed" test
      var todos = [{id: 1, title: 'my first todo', completed: false}, {id: 2, title: 'my second todo', completed: false}];
      setUpModel(todos);

    //-- setting the view on main page
    subject.setView('');

    //-- if we click on the "complete all task" button
    view.trigger('toggleAll', {completed: true});

    //-- we expecteach of the todos to updates with their "completed" attributes to be changed to "true"
    expect(model.update).toHaveBeenCalledWith(1, {completed: true}, jasmine.any(Function));
    expect(model.update).toHaveBeenCalledWith(2, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {
      //-- creating two todos for multiple "completed" test
      var todos = [{id: 3, title: 'my first todo', completed: false}, {id: 4, title: 'my second todo', completed: false}];
      setUpModel(todos);

      //-- setting the view on main page
      subject.setView('');

      //-- if we click on the "complete all task" button
      view.trigger('toggleAll', {completed: true});

      //-- we expect the todo's "completed" attribute to be "true"
      expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 3, completed: true});
      expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 4, completed: true});

		});
	});

	describe('new todo', function () {
		it('should add a new todo to the model', function () {
      //-- setting the view on main page
      subject.setView('');

      //-- if we create a new todo in our input
      view.trigger('newTodo', 'a new todo');

      //-- We expect the model to create a new todo with the inout value as title
      expect(model.create).toHaveBeenCalledWith('a new todo',jasmine.any(Function));
		});

		it('should add a new todo to the view', function () {
			setUpModel([]);

			subject.setView('');

			view.render.calls.reset();
			model.read.calls.reset();
			model.read.and.callFake(function (callback) {
				callback([{
					title: 'a new todo',
					completed: false
				}]);
			});

			view.trigger('newTodo', 'a new todo');

			expect(model.read).toHaveBeenCalled();

			expect(view.render).toHaveBeenCalledWith('showEntries', [{
				title: 'a new todo',
				completed: false
			}]);
		});

		it('should clear the input field when a new todo is added', function () {
			setUpModel([]);

			subject.setView('');

			view.trigger('newTodo', 'a new todo');

			expect(view.render).toHaveBeenCalledWith('clearNewTodo');
		});
	});

	describe('element removal', function () {
		it('should remove an entry from the model', function () {

      //-- Create a fake todo to be the model with fake data and set it to be completed
      var todo = {id: 6, title: 'my todo', completed: true};
      setUpModel([todo]);

      subject.setView('');

      //-- if we dispatch the "itemRemove" event (by clicking on the cross)
      view.trigger('itemRemove', {id: 6});

      //-- we expect the model with the id 42 to be removed from db
      expect(model.remove).toHaveBeenCalledWith(6,jasmine.any(Function));
		});

		it('should remove an entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});

		it('should update the element count', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('itemRemove', {id: 42});

			expect(view.render).toHaveBeenCalledWith('updateElementCount', 0);
		});
	});

	describe('remove completed', function () {
		it('should remove a completed entry from the model', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(model.read).toHaveBeenCalledWith({completed: true}, jasmine.any(Function));
			expect(model.remove).toHaveBeenCalledWith(42, jasmine.any(Function));
		});

		it('should remove a completed entry from the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);

			subject.setView('');
			view.trigger('removeCompleted');

			expect(view.render).toHaveBeenCalledWith('removeItem', 42);
		});
	});

	describe('element complete toggle', function () {
		it('should update the model', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 21, completed: true});

			expect(model.update).toHaveBeenCalledWith(21, {completed: true}, jasmine.any(Function));
		});

		it('should update the view', function () {
			var todo = {id: 42, title: 'my todo', completed: true};
			setUpModel([todo]);
			subject.setView('');

			view.trigger('itemToggle', {id: 42, completed: false});

			expect(view.render).toHaveBeenCalledWith('elementComplete', {id: 42, completed: false});
		});
	});

	describe('edit item', function () {
		it('should switch to edit mode', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEdit', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItem', {id: 21, title: 'my todo'});
		});

		it('should leave edit mode on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'new title'});
		});

		it('should persist the changes on done', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: 'new title'});

			expect(model.update).toHaveBeenCalledWith(21, {title: 'new title'}, jasmine.any(Function));
		});

		it('should remove the element from the model when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(model.remove).toHaveBeenCalledWith(21, jasmine.any(Function));
		});

		it('should remove the element from the view when persisting an empty title', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditDone', {id: 21, title: ''});

			expect(view.render).toHaveBeenCalledWith('removeItem', 21);
		});

		it('should leave edit mode on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(view.render).toHaveBeenCalledWith('editItemDone', {id: 21, title: 'my todo'});
		});

		it('should not persist the changes on cancel', function () {
			var todo = {id: 21, title: 'my todo', completed: false};
			setUpModel([todo]);

			subject.setView('');

			view.trigger('itemEditCancel', {id: 21});

			expect(model.update).not.toHaveBeenCalled();
		});
	});
});
