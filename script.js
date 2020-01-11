var blockser = [
  {block: "P", name: "Player"},
  {block: "@", name: "Portal"},
  {block: "M", name: "Trampoline"},
  {block: "b", name: "Normal block"},
  {block: "_", name: "Ice"},
  {block: "#", name: "Lava"},
  {block: "&", name: "Monster"},
  {block: "%", name: "Cannon"},
  {block: "-", name: "Block of ice"},
  {block: "X", name: "Brick"},
  {block: ">", name: "Spike right"},
  {block: "A", name: "Spike up"},
  {block: "<", name: "Spike left"},
  {block: "V", name: "Spike down"},
  {block: "?", name: "Mystery box"},
  {block: "E", name: "Acid"},
  {block: "C", name: "Mystery box that disappears"},
  {block: " ", name: "Blank air"}
];
blockser.forEach(function(i){
  $('.blocks').append(
    $("<tr>").append(
      $("<td>").html(i.block).css("font-weight","bolder").addClass("select"),
      $("<td>").html(i.name)
    )
  )
  $('.palette').append(
    $("<button>").addClass("choose").html(i.block)
    .attr("title", i.name)
    .click(function(){
      $('.palette .choose').removeClass("chose");
      $(this).addClass("chose");
      selected = $(this).text();
    })
  );
});
$('.palette .choose:last-child').addClass("chose");
/**
 * <div class = "mrow">
        <button class = "mblock"></button><button class = "mblock"></button><button class = "mblock"></button><button class = "mblock"></button><button class = "mblock"></button>
      </div>
 */
String.prototype.replaceAt = function(index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}
Array.prototype.insert = function (index, item) {
  this.splice(index, 0, item);
};
var selected = " ";
function update(){
  $('.maker').empty();
  array.forEach(function(i){
    var a = i.split("");
    var el = $('<div>').addClass("mrow row");
    a.forEach(function(e){
      el
        .append($('<button>')
        .html(e)
        .addClass("col mbtn"))
    })
    $('.maker').append(el);
  });
  $('.mrow').each(function(){
    $(this).width($(this).children().length * 55)
  });
  $('.mbtn').click(function(){
    var $div = $(this).parent();
    var row = $('.mrow').index($div);
    var col = $(this).index();
    array[row] = array[row].replaceAt(col, selected);
    update();
  });
  leveler = [
    array
  ];
  change(leveler);
}
update();
$('.arb').click(function(){
  var len = array[0].length;
  var text = "";
  for(var i = 0; i < len; i ++){
    text += " ";
  }
  array.push(text);
  update();
});
$('.acr').click(function(){
  array = array.map(function(i){
    return i + " ";
  });
  update();
});
$('.art').click(function(){
  var len = array[0].length;
  var text = "";
  for(var i = 0; i < len; i ++){
    text += " ";
  }
  array.insert(0, text);
  update();
});
$('.acl').click(function(){
  array = array.map(function(i){
    return " " + i;
  });
  update();
});
$('.ca').click(function(){
  if(confirm("Are you sure?")){
    array = array.map(function(t){
      var txt = "";
      for(var i = 0; i < t.length; i ++){
        txt += " ";
      }
      return txt;
    });
    update();
  }
});
$('.mbc').click(function(){
  var target = array[array.length-1];
  var newtxt = target.split("");
  newtxt = newtxt.map(function(i){
    return selected;
  });
  array[array.length-1] = newtxt.join("");
  update();
});
$('.copy').click(function(){
  var output = "[<br>";
  array.forEach(function(i, n){
    output += "&nbsp;&nbsp;'"+i.replace(/\ /gi, "&nbsp;")+"'"+(n<array.length-1?",<br>":"<br>],");
  });
  $('.level').html(output);
});
$('.close').click(function(){
  $('.close,.game').fadeOut(500);
});
$('.prev').click(function(){
  $('.close,.game').fadeIn(500);
});