(function(){
    //获取列表数据
    function getCommonItems(listTitle, filterStr, OrderBy) {
        var dtd = $.Deferred();
        queryList.rest(null, encodeURIComponent(listTitle), null, OrderBy ? OrderBy : 'ID asc', filterStr, function (data) {
          dtd.resolve(data);
        }, function (jqXHR, textStatus, errorThrown) {
          alert('获取' + listTitle + '失败，请刷新后重试');
          dtd.reject();
        });
        return dtd.promise();
      }
     //获取项目组成员
     function getPerson() {
        return getCommonItems("项目组成员", "&$select=zyzt,fpbl,jhwcsj,shry/ID,shry/Title,sjry/ID,sjry/Title,jhry/ID,jhry/Title,Id,Title&$expand=shry,sjry,jhry&$filter=JdId eq '" + projectId + "'");
      }
      //获取人员名字
      function getPersonStr(results) {
        var pres = [];
        if (results) {
          $.each(results, function (i, item) {
            pres.push(item.Title);
          });
        }
        return pres.length > 0 ? pres.join('；') : "";
      }
      //获取urlparameter
      function getQueryStringParameter(paramToRetrieve) {
        var docUrl = document.URL;
        docUrl = docUrl.split("#/")[0];
        if (docUrl.indexOf("?") > -1) {
          var params = docUrl.split("?")[1].split("&");
          var strParams = "";
          for (var i = 0; i < params.length; i = i + 1) {
            var singleParam = params[i].split("=");
            if (singleParam[0] == paramToRetrieve)
              return singleParam[1];
          }
        }
      }
      //判断权限
      function judgepower(array){
        var ArrayItems = []; 
         $.each(array,function(i,item){
            item.isSJRY = ko.observable(false); 
            item.Title = ko.observable(item.Title);
            item.zyzt = ko.observable(item.zyzt);
            item.shrystr = ko.observable(getPersonStr(item.shry.results));
            item.sjrystr = ko.observable(getPersonStr(item.sjry.results));
            if(item.sjrystr == dataModel.uTitle){
                item.isSJRY = true;
            }
            item.jhrystr = ko.observable(getPersonStr(item.jhry.results));
            item.fpbl = ko.observable(item.fpbl);
            item.jhwcsj = ko.observable(item.jhwcsj);
            ArrayItems.push(item)
         })
         return ArrayItems;
      } 
      //获取url中ID的值
      var projectId = getQueryStringParameter("ID");
      var dataModel = {
        subItems: ko.observableArray([]),
        uTitle:"",
        StatusList : ko.observableArray([{"StatusID": "1","StatusName": "设计中"},{"StatusID": "2","StatusName": "已完成"}]),
        EditClick: function () {
            dataModel.isEdit(true);
          }
      }
      $.when(getPerson()).done(function(personItem){
          if(personItem.length>0){
            //定义编辑按钮
            dataModel.isEdit = ko.observable(false);
             //获取用户组
             getUser(function (uObj, uTitle) {
                dataModel.uTitle = uTitle;
                var Peritem = judgepower(personItem);
                dataModel.subItems(Peritem);
              //绑定datamodel
                ko.applyBindings(dataModel, $('.subTablemain')[0]);
                $('.subTablemain').show();
              }, function () {
                alert('获取当前用户失败,请重试！');
              });
          }
          else
          {
              alert("当前没有项目组成员信息")
          }
      })
})();