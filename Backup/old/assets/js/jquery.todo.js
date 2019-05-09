/**
* Theme: Velonic Admin Template
* Author: Coderthemes
* Todo Application
*/

    "use strict";


    var TodoApp = function(qualId) {
        this.$body = $("body"),
        this.$todoContainer = $('#todo-container_'+qualId),
        this.$todoMessage = $("#todo-message_"+qualId),
        this.$todoRemaining = $("#todo-remaining_"+qualId),
        this.$todoTotal = $("#todo-total_"+qualId),
        this.$archiveBtn = $("#btn-archive_"+qualId),
        this.$todoList = $("#todo-list_"+qualId),
        this.$todoDonechk = ".todo-done_"+qualId,
          this.$todoDonechkName = "todo-done_"+qualId,
        this.$todoForm = $("#todo-form_"+qualId),
        this.$todoInput = $("#todo-input-text_"+qualId),
        this.$todoBtn = $("#todo-btn-submit_"+qualId),
        
        this.$todoData = [
        // {
        //     'id': '1',
        //     'text': 'Design One page theme',
        //     'done': false
        // },
      ];

        this.$todoCompletedData = [];
        this.$todoUnCompletedData = [];
    };

    //mark/unmark - you can use ajax to save data on server side
    TodoApp.prototype.markTodo = function(todoId, complete) {
       for(var count=0; count<this.$todoData.length;count++) {
            if(this.$todoData[count].id == todoId) {
                this.$todoData[count].done = complete;
            }
       }
    },
    //adds new todo
    TodoApp.prototype.addTodo = function(qualId,todoText) {
        // alert(qualId);
        this.$todoData.push({'id': this.$todoData.length, 'text': todoText, 'done': false});
        //regenerate list
        this.generate(qualId);
    },
    //Archives the completed todos
    TodoApp.prototype.archives = function(qualId) {
        // alert(qualId);
    	this.$todoUnCompletedData = [];
        
        console.log(this.$todoData);
        for(var count=0; count<this.$todoData.length;count++) {
            //geretaing html
            var todoItem = this.$todoData[count];
            if(todoItem.done == true) {
                // alert();
                this.$todoCompletedData.push(todoItem);
            } else {
                this.$todoUnCompletedData.push(todoItem);
            }
        }
        this.$todoData = [];
        this.$todoData = [].concat(this.$todoUnCompletedData);
        //regenerate todo list
        this.generate();
    },
    //Generates todos
    TodoApp.prototype.generate = function(qualId) {
        //clear list
        this.$todoList.html("");
        var remaining = 0;
        for(var count=0; count<this.$todoData.length;count++) {
            //geretaing html
            var todoItem = this.$todoData[count];
            if(todoItem.done == true)
            {
                 var ddd='<li class="list-group-item"><div class="checkbox checkbox-primary"><input class="todo-done" id="' + todoItem.id + '" type="checkbox" checked><label for="' + todoItem.id + '">' + todoItem.text + '</label></div></li>';
            
                this.$todoList.prepend(ddd.replace('todo-done', this.$todoDonechkName));
            }
               
            else {
                remaining = remaining + 1;
              var ddd='<li class="list-group-item"><div class="checkbox checkbox-primary"><input class="todo-done" id="' + todoItem.id + '" type="checkbox"><label for="' + todoItem.id + '">' + todoItem.text + '</label></div></li>';
                  this.$todoList.prepend(ddd.replace('todo-done', this.$todoDonechkName));
            }
        }

        //set total in ui
        this.$todoTotal.text(this.$todoData.length);
        //set remaining
        this.$todoRemaining.text(remaining);
    },
    //init todo app
    TodoApp.prototype.init = function (qualId) {
        var $this = this;
        //generating todo list
        this.generate(qualId);

        //binding archive
        this.$archiveBtn.on("click", function(e) {
        	e.preventDefault();
            $this.archives(qualId);
            return false;
        });

        //binding todo done chk
        $(document).on("change", this.$todoDonechk, function() {
            if(this.checked) 
                $this.markTodo($(this).attr('id'), true);
            else
                $this.markTodo($(this).attr('id'), false);
            //regenerate list
            $this.generate(qualId);
        });

        //binding the new todo button
        this.$todoBtn.on("click", function() {
            if ($this.$todoInput.val() == "" || typeof($this.$todoInput.val()) == 'undefined' || $this.$todoInput.val() == null) {
                // sweetAlert("Oops...", "You forgot to enter todo text", "error");
                $this.$todoInput.focus();
            } else {
                $this.addTodo(qualId,$this.$todoInput.val());
                $this.$todoInput.val('');
            }
        });
         $this.$todoInput.keyup( function(e) {
              if (e.keyCode == 13) {
           if ($this.$todoInput.val() == "" || typeof($this.$todoInput.val()) == 'undefined' || $this.$todoInput.val() == null) {
                // sweetAlert("Oops...", "You forgot to enter todo text", "error");
                $this.$todoInput.focus();
            } else {
                $this.addTodo(qualId,$this.$todoInput.val());
                $this.$todoInput.val('');
            }
            return false; // prevent the button click from happening
        }
           
        });
    }
    

