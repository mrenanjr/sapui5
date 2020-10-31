sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
 ], function (Controller, JSONModel) {
    "use strict";
    return Controller.extend("sap.ui.demo.walkthrough.controller.BookList", {
		constructor : function () {
			this.book = {
				name: "",
				year: 2020,
				authorId: 0,
				idElementTable: 0,
				authors: []
			};
			this.data = {
				booksData: [],
				book: this.book
			};
			$.ajax({
                type : "GET",
                contentType : "application/json",
                url : "http://localhost:8080/api/book",
                dataType : "json",
                async: true, 
                success : this.resSuccess.bind(this),
                error: [this.resError, this]
            });
		},
		onlyUnique : function(value, index, self) {
			return self.indexOf(value) === index;
		},
		resSuccess : function(respData) {
			this.data.booksData = respData;
			var authors = this.data.book.authors;
			var oModel = new JSONModel(this.data);
			var oView = this.getView();
			$.ajax({
                type : "GET",
                contentType : "application/json",
                 url : "http://localhost:8080/api/author",
                dataType : "json",
                async: true, 
                success : function(result) {
					authors = Array.from(new Set(result.map(item => item.id)))
						.map(id => {
							return {
								id: id,
								name: result.find(s => s.id == id).name
							}
						});
					oModel.setProperty("/book/authors", authors);
					oView.setModel(oModel);
				},
                error: [this.resError, this]
            });
        },
        resError : function(error) {
            alert("Falha na requisição")
		},
        handleAddBook : function() {
			if(!this._bookRegisterDialog)
			{
				this._bookRegisterDialog = sap.ui.xmlfragment("sap.ui.demo.walkthrough.view.BookRegister", this);
				var oModel = new JSONModel();
				this._bookRegisterDialog.setModel(oModel);
			}

			this._bookRegisterDialog.getModel().setData(this.data);
			this._bookRegisterDialog.open();
		},
		handleEditBook : function(oEvent) {
			var oCurrentBook = oEvent.getSource().getBindingContext().getObject();
			this.data.book.authorId = oCurrentBook.authorId;
			this.data.book.name = oCurrentBook.title;
			this.data.book.year = oCurrentBook.year;
			this.data.book.idElementTable = oCurrentBook.id;
			this.handleAddBook();
		},
		handleRemoveBook : function(oEvent) {
			var oCurrentBook = oEvent.getSource().getBindingContext().getObject();
			var oModel = this.getView().getModel();
			var oViewData = oModel.getData()
			
			$.ajax({
				type : "DELETE", 
                url : `http://localhost:8080/api/book/${oCurrentBook.id}`,
                async: true, 
                success : function() {
					oViewData.booksData = oViewData.booksData.filter(f => f.id !== oCurrentBook.id);
					oModel.setData(oViewData);
					alert("Livro removido com sucesso!");
				},
                error: function(err) {
					alert("Erro ao tentar remover o livro!");
				}
			});
		},
		handleCloseRegisterBook : function() {
			this._bookRegisterDialog.close();
		},
		handleSaveNewBook : function() {
			var oModel = this.getView().getModel();
			var oViewData = oModel.getData()
			var newbook = {
				id: oViewData.book.idElementTable,
				title: oViewData.book.name,
				year: Number(oViewData.book.year),
				authorId: oViewData.book.authorId
			}

			$.ajax({
				type : "POST",
				data: JSON.stringify(newbook), 
                contentType : "application/json",
                url : "http://localhost:8080/api/book",
                dataType : "json",
                async: true, 
                success : function(data) {
					data.author = oViewData.book.authors.find(f => f.id === data.authorId);
					!!oViewData.book.idElementTable ?
						oViewData.booksData[oViewData.booksData.findIndex(f => f.id === data.id)] = data :
						oViewData.booksData.push(data);
					oModel.setData(oViewData);
					alert(!!oViewData.book.idElementTable ? "Atualizado com sucesso!" : "Criado com sucesso!");
				},
                error: function(err) {
					alert(err.status === 403 ? err.responseText : "Erro ao tentar adicionar livro");
				}
			});
			
			this.handleCloseRegisterBook();
		},
		selectChanged : function(oEvent) {
			var selectedItem = oEvent.getSource().getSelectedItem();
			if(!!selectedItem.getText()) {
				var oModel = this.getView().getModel();
				oModel.setProperty("/book/authorId", Number(selectedItem.getKey()))
			}
		}
    });
 });