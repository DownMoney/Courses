QBLoad();

function showQB(e){
	

	e.preventDefault();
	if($('#qbTab').hasClass('active'))
		$('#qbTab').removeClass('active');
	else
		$('#qbTab').addClass('active');
	$('div.qb').toggle('slide');
}



var page = 0;
var taken = 'null';
  var pro =[];
  var co =[];
  var pre =[];
  var taking = {};


function startSearch()
{
    NProgress.start();   
    page = 0;  
    load($('.search').val(),0, true);
}

function LoadComp()
{
  $.getJSON('http://54.214.7.238/Search.svc/complete/'+$('.search').val(), function(data) {
       

  var items = [];
  $.each(data['completeResult'], function(key, val) {
    items.push(val);    
  });
Complete(items);
});
}

function Complete(tags)
{
$( ".search" ).autocomplete({
  source: function( request, response ) {
          var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
          response( $.grep( tags, function( item ){
              return matcher.test( item );
          }) );
      }
});
}


$(window).scroll(function()
{
  console.log($(window).scrollTop());
  console.log($(document).height() - $(window).height()-100);
    if($(window).scrollTop() >= $(document).height() - $(window).height()-100)
    {
      page++;
        //load($('.search').val(), page, false);
    }
});


function loadMore(e)
{
	e.preventDefault();
	page++;
        load($('.search').val(), page, false);
}

function take(Name, Code, self)
{
	if($(self).parent().hasClass('todo-done'))
	{
		delete taking[Code];
		untake(Code, self);
	}
	else
	{

$(self).parent().addClass('todo-done');
//$('#circularG').show('fly');
	
	taking[Code] = Name;

  if(taken=='null')
    taken = Code;
  else
    taken+=';'+Code;
  console.log(taken);
  fillReq($('.search').val(),0);
 // load($('.search').val(),0, true);
}
  
}

function untake(Code, self)
{
	if(self!=null)
	$(self).parent().removeClass('todo-done');
  taken = taken.replace(","+Code,"");
  taken = taken.replace(Code,"");
  if(taken=='')
    taken='null';

pro=[];
pre=[];
co=[];

$('#preReq').html('');
$('#coReq').html('');
$('#proReq').html('');


  fillReq($('.search').val(),0);
 // load($('.search').val(),0, true);

}

function rem(Code, text, p){
	$('#'+Code).removeClass('todo-done');
	delete taking[Code];
	untake(Code, null);
}

function fillReq( text, p){
	var ite = [];
for(var k in taking)
	ite.push('<li><span  onclick="displayInfo(\''+k+'\',event);">'+taking[k]+'</span>&nbsp;<span class="fui-cross" onclick="rem(\''+k+'\',\''+text+'\','+p+');"></span></li>');

$('#taking').html(ite.join(''));
$.getJSON('http://54.214.7.238/Search.svc/search/'+text+'/'+p+'/'+taken, function(data) {
	
	$.each(data['search2Result'], function(key, val) {

		if(val['Name'].indexOf('red')!=-1 && $.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', pro) == -1)
		{
			$('#'+val['Code']).remove();
        pro.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');
    	}

      if(val['Name'].indexOf('green')!=-1 && $.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', co) == -1)
        co.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');



      if((val['Name'].indexOf('orange')!=-1) && ($.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', pre) == -1))
      
        pre.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');
});



	$('#preReq').html(jQuery.unique(pre).join(''));
$('#coReq').html(co.join(''));
$('#proReq').html(pro.join(''));
});
}

function displayInfo(Code, e){
	e.preventDefault();

	$.getJSON('http://54.214.7.238/Search.svc/get/'+Code, function(data) {
	
	$.each(data['getResult'], function(key, val) {
		$('h4.modal-title').html(val['Name']);
		$('#desc').html(val['Description']);
		$('#code').html(val['Code']);
		$('#cl').html(val['CreditLevel']);
		$('#credits').html(val['Credits']);
		$('#cw').html(val['CourseWebsite']);
		$('#fc').html(val['FirstClass']);
		$('#ai').html(val['AssessmentInfo']);
		$('#ava').html(val['Availability']);
		$('#col').html(val['College']);
		$('#lo').html(val['LearningOutcomes']);
		$('#rl').html(val['ReadingList']);
		$('#or').html(val['OtherRequiments']);
		$('#sp').html(val['StudyPatterns']);
		$('#ad').html(val['AcademicDesc']);	
		$('#syl').html(val['Syllabus']);	
		$('#hm').html(val['HomeSubjectArea']);	

		if(val['Quota']=='-1')
			$('#quota').html('None');
		else
			$('#quota').html(val['Quota']);

		if(val['Learn']=='True')
			$('#learn').html('Yes');
		else
			$('#learn').html('No');

		$('#ac').html(val['AdditionalCosts']);
		$('#per').html(val['Period']);

		$('#drps').html('<a href="http://www.drps.ed.ac.uk/13-14/dpt/'+val['URL']+'" target="_blank">'+val['Name']+'</a>');
	});

	$('#myModal').modal({show:true});
});
}

function moreInfo(self){
	$('h4.modal-title').html($(self).data('name'));
	$('#desc').html($(self).data('description'));
	$('#code').html($(self).data('code'));
	$('#type').html($(self).data('type'));
	$('#start').html($(self).data('timestart'));
	$('#end').html($(self).data('timeend'));
	$('#location').html($(self).data('location'));
	$('#myModal').modal({show:true});
}

function load(text, p, dest){
		
		socket.emit('search', {text: text});

    
}

function populate(data){
	 $('#loadMore').show();

  var items = [];

console.log(data);


  $.each(data, function(key, val) {
    if(val['Name']!='')
    {
      if(val['Name'].indexOf('<i style')==-1)
      {
      	items.push('<li id="'+val['Code']+'" >');
      	/*if(taken.indexOf(val['Code']) == -1)
      		
      		else      			
      	items.push('<li id="'+val['Code']+'" onclick="untake(\''+val['Code']+'\', this);" class="todo-done">');*/
      items.push('                <div class="todo-icon fui-list" onclick="displayInfo(\''+val['Code']+'\',event);"></div>                <div class="todo-content" onclick="take(\''+val['Name']+'\',\''+val['Code']+'\', this);" >                  <h4 class="todo-name" >'+val['Name']+'</h4><div>');

      /*if(taken.indexOf(val['Code']) == -1)
      items.push('<button onclick="take(\''+val['Code']+'\');">take</button>');
    else
      items.push('<button onclick="untake(\''+val['Code']+'\');">remove</button>');*/

      items.push(val['Description']+'</div></div>              </li>');
    }


     if(val['Name'].indexOf('red')!=-1 && $.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', pro) == -1)
		{
			$('#'+val['Code']).remove();
        pro.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');
    	}

      if(val['Name'].indexOf('green')!=-1 && $.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', co) == -1)
        co.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');



      if((val['Name'].indexOf('orange')!=-1) && ($.inArray('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>', pre) == -1))
      
        pre.push('<li onclick="displayInfo(\''+val['Code']+'\',event);">'+val['Name']+'</li>');
      

     
}

  });

$('#preReq').html(jQuery.unique(pre).join(''));
$('#coReq').html(co.join(''));
$('#proReq').html(pro.join(''));
 
 //if(dest)
  $('#body').html(items.join(''));

   NProgress.done();
//else
  //$('#body').append(items.join(''));
  
}

function QBLoad(){
	fillOptions($('#tb'), 'people');
	fillOptions($('#cred'), 'credits');	
	fillOptions($('#school'), 'schools');
	fillOptions($('#managed'), 'people');
	fillOptions($('#year'), 'year');
	fillOptions($('#sa'), 'students');
	fillOptions($('#semester'), 'semester');
}

function addToSearch(self, text){
	search();
	/*if($(self).val()!='0')
	{
		if($('.search').val()=='')
			$('.search').val('courses that '+text+' '+$(self).val());
		else
			$('.search').val($('.search').val()+' and '+text+' '+$(self).val());
	}*/
}

function fillOptions(o, token){
	$.getJSON('http://54.214.7.238/Search.svc/getToken/'+token, function(data) {
	
	$.each(data['getTokenResult'], function(key, val) {
		$(o).append('<option value="'+val.val+'">'+val.val+'</option>');
	});
});
}



          function show () {
           
            
           NProgress.start();

                
            
          }
        



function AddClass(Name, Room, Row, Day){
 	$('#tue > li:nth-child('+Row+')').html('<div class="todo-content"><h4 class="todo-name">'+Name+'</h4><small>'+Room+'</small></div>'+GetMenu(0,0)+''); 	
}

function GetMenu(SID, UID){
	return '<ul><li><a href="#fakelink">Notes</a><ul><li><a href="#fakelink" onclick="newNote('+SID+', '+UID+');">New Note</a></li><li><a href="#fakelink">Sample Note - <small>Michael Lotkowski</small></a></li></ul></li><li><a href="#fakelink">Files</a><ul><li><a href="#fakelink">Upload File</a></li><li><a href="#fakelink">Presentation.pptx</a></li></ul></li><li><a href="#fakelink">Todo</a><ul><li><input type="text"/></li><li><a href="#fakelink">Read chapters 1-2</a></li></ul></li><li><a href="#fakelink">Chat</a><ul><li><a href="#fakelink">Class</a></li><li><a href="#fakelink">Course</a></li></ul></li></ul>';
}

function newNote(SID, UID){
	$('#note').jqte();
	$('#newNote').show();
	$('#newNote').modal({show: true});
}

function search(){
/*	query = "courses that ";
if($('#tb').val()!='0')
	query+="taught by "+$('#tb').val()+" and ";
if($('#cred').val()!='0')
	query+="are worth "+$('#cred').val()+" credits and ";
if($('#school').val()!='0')
	query+="are done by the "+$('#school').val()+" and ";
if($('#sa').val()!='0')
	query+="are "+$('#sa').val()+" and ";
if($('#year').val()!='0')
	query+="are suitable for "+$('#year').val()+" and ";
if($('#semester').val()!='0')
	query+="run in "+$('#semester').val()+" and ";
if($('#about').val()!='')
	query+="are about "+$('#about').val()+" and ";
if(document.getElementById("naf").checked)
	query+="have no additional fees and ";
if(document.getElementById("le").checked)
	query+="are learn enabled and ";
if(document.getElementById("nrl").checked)
	query+="have no reading list and ";
if(document.getElementById("nq").checked)
	query+="have no quota and ";
query = query.substring(0, query.length - 5)
$('.search').val(query);*/


socket.emit('searchFilter', {tb:$('#tb').val(), cred:$('#cred').val(), school:$('#school').val(), sa: $('#sa').val(), year: $('#year').val(), semester: $('#semester').val(), about: $('#about').val(), naf: document.getElementById("naf").checked, le: document.getElementById("le").checked, nrl: document.getElementById("nrl").checked, nq: document.getElementById("nq").checked });

}

