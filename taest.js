(function () {
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
  //更新项目组成员列表
  function updatePerson(pitem) {
    var hasSaved = true;
    var dli = {};
    dli.__metadata = {
      "type": "SP.Data.XmzcyListItem"
    };
    dli.zyzt = pitem.StatusSelected();
    $.ajax({
      url: _spPageContextInfo.webServerRelativeUrl + "/_api/web/lists/getbytitle('" + encodeURIComponent('项目组成员') + "')/items(" + item.Id + ")",
      headers: {
        "accept": "application/json; odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        'IF-MATCH': '*',
        'X-HTTP-Method': 'PATCH'
      },
      data: JSON.stringify(dli),
      type: 'POST',
      async: true,
      contentType: "application/json;odata=verbose"
    }).then(function (data) {
      loopCount++;
    }, function (jqXHR, textStatus, errorThrown) {
      hasSaved = false;
    });
    return hasSaved;
  }
  //判断权限
  function judgepower(array) {
    var ArrayItems = [];
    $.each(array, function (i, item) {
      item.StatusSelected = ko.observable('');
      item.isSJRY = ko.observable(false);
      item.Title = ko.observable(item.Title);
      item.zyzt = ko.observable(item.zyzt);
      item.shrystr = ko.observable(getPersonStr(item.shry.results));
      item.sjrystr = ko.observable(getPersonStr(item.sjry.results));
      if (item.sjrystr == dataModel.uTitle) {
        item.isSJRY = true;
        dataModel.isPower = true;
      }
      item.jhrystr = ko.observable(getPersonStr(item.jhry.results));
      item.fpbl = ko.observable(item.fpbl);
      item.jhwcsj = ko.observable(item.jhwcsj);
      item.zyztOld = item.zyzt();
      ArrayItems.push(item)
    })
    return ArrayItems;
  }
  //获取url中ID的值
  var projectId = getQueryStringParameter("ID");
  var dataModel = {
    subItems: ko.observableArray([]),
    uTitle: "",
    StatusList: ko.observableArray([{ "StatusID": "1", "StatusName": "设计中" }, { "StatusID": "2", "StatusName": "已完成" }]),
    //保存项目组成员
    SaveClick: function () {
      if (!dataModel.isPower) {
        location.reload();
        return;
      }
      if (dataModel.isSaveing) {
        return;
      }
     
      $.each(dataModel.subItems(), function (i, item) {
        if (item.Title.length == 0) {
          hasNull = true;
          return;
        }
      });
      SP.UI.ModalDialog.showWaitScreenWithNoClose('正在保存', null, 75, 200);

      dataModel.isSaveing = true;
      var hasSaved = false;
      var saveCount = 0;
      $.each(dataModel.subItems(), function (i, item) {
        if (item.zyztOld != item.zyzt()) {
          saveCount++;
          new updatePerson(item);
        }
      });
      var sil = setInterval(function () {
        if (saveCount == loopCount) {
          if (hasSaved) {
            clearInterval(sil);
            SP.UI.ModalDialog.commonModalDialogClose(SP.UI.DialogResult.OK);
            location.reload();
          } else {
            alert('保存失败，请刷新重试');
            dataModel.isSaveing = false;
            clearInterval(sil);
          }
        }
      }, 500);
    }
  }
  $.when(getPerson()).done(function (personItem) {
    if (personItem.length > 0) {
      //定义编辑权限
      dataModel.isPower = ko.observable(false);
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
    else {
      alert("当前没有项目组成员信息")
    }
  })
})();