function HomeTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function CommunitiesMainTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function CollectionMainTab(evt, cityName) {
  debugger;
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function CollectionMainTab1(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band1");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink1");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function CollectionMainTab2(evt, cityName) {
  var i, x, tablinks;
  x = document.getElementsByClassName("text-band1");
  for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink1");
  for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" current", "");
  }
  document.getElementById(cityName).style.display = "block";
  evt.currentTarget.className += " current";
}

function CommunitySubTab(evt, cityName) {
    //console.log('showSubCabinetTab',showSubCabinetTab);
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-main");

    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tabsublink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function WorkSPaceParentTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
  }

  function WorkSPaceParentTabCustom(evt, cityName,countryName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
  }
  function ChildTab1(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-db1");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinkone");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }

  function WorkSPaceParentTabCustom2(evt, cityName,countryName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
    // var i, x, tablinks;
    // x = document.getElementsByClassName("text-band-db2");
    // for (i = 0; i < x.length; i++) {
    //   x[i].style.display = "none";
    // }
    // tablinks = document.getElementsByClassName("tablinktwo");
    // for (i = 0; i < x.length; i++) {
    //   tablinks[i].className = tablinks[i].className.replace(" active", "");
    // }
    // document.getElementById(cityName).style.display = "block";
    // evt.currentTarget.className += " active";
  }
  function ChildTab2(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-db2");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinktwo");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }
     function ChildTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-db");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinkone");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }



  
//   $('#summernote').summernote({
//     placeholder: 'Write something new...',
//     tabsize: 2,
//     height: 400,
//     toolbar: [
//       ['style', ['style']],
//       ['font', ['bold', 'underline', 'clear']],
//       ['color', ['color']],
//       ['para', ['ul', 'ol', 'paragraph']],
//       ['table', ['table']],
//       ['insert', ['link', 'picture', 'video']],
//       ['view', ['fullscreen', 'codeview', 'help']]
//     ]
//   });

function openCity(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-db");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinkone");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

function outwardTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" current", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " current";
}

function Showmore(id)
{   
    console.log('IDDDDD',id);
   
        $(".menu-onclick-"+id+"").click(function(){
          $(".show-"+id+"").toggle();
        });
       
}

function HomeTrendingChildTab(evt, cityName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("text-band-db");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinkone");
    for (i = 0; i < x.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
  }

/*Created table using javascript*/ 

function userAdd()
{
    if ($("#workflowName").val() != null && document.getElementById("users").value != '0') {
        // Add product to Table
        UserAddToTable();

        // Clear form fields
        formClear();

        // Focus to product name field
        $("#workflowName").focus();
    }
}
function UserAddToTable()
{

    var e = document.getElementById("users");
    var value = e.value;
    var text = e.options[e.selectedIndex].text;

    // First check if a <tbody> tag exists, add one if not
    if ($("#usertable tbody").length == 0) {
        $("#usertable").append("<tbody></tbody>");
    }

    // Append product to the table
    $("#usertable tbody").append("<tr>" +
        // "<td>" + $("#workflowName").val() + "</td>" +
        "<td>" + text+ "</td>" +
        "<td>" +
        "<button type='button'onclick='up(this);'class='btn btn-default btn-primary btn-dynamic'><i class='fa fa-arrow-up' aria-hidden='true'></i>" +
        "<button type='button'onclick='down(this);'class='btn btn-default btn-primary btn-dynamic'><i class='fa fa-arrow-down' aria-hidden='true'></i>" +
        "<button type='button'onclick='userDelete(this);'class='btn btn-default btn-primary btn-dynamic'><i class='fa fa-trash' aria-hidden='true'></i>" +
        "</button>" +
        "</td>" +
        "</tr>");
}

function formClear() {
    $("#workflowName").val("");
    document.getElementById('users').selectedIndex = 0;
}

function userDelete(ctl) {
    $(ctl).parents("tr").remove();
}

function up(ctl)
{
    var row = $(ctl).parents('tr:first');
    row.insertBefore(row.prev())
}

function down(ctl)
{
    var row = $(ctl).parents('tr:first');
    row.insertAfter(row.next());
}
/*Created table using javascript*/ 