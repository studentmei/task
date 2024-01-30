import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();
const template = fs.readFileSync("./template.html", "utf-8");

//前回入力したスレッド
let previous_thread = "undefined";

//データベースからこれまでのpostsを受け取る
app.get("/", async (request, response) => {
  //これまでのpostsを受け取る
  const posts = await prisma.post.findMany();
  //デバッグ用
  for(let i = 0;i < posts.length;i++){
    //console.log(posts[i]); 
  }

  //postsの中身を処理する
  let l = [];
  let thread_name = [];
  let thread_contents = []; 
  // postsの中身を見る
  for(let i = 0;i < posts.length;i++){
	//メッセージの内容があり、threadが空だったら、メッセージ内容をlに追加
	if(posts[i].message != "undefined" && posts[i].thread == "undefined"){
		l.push(`<p>${escapeHTML(posts[i].message)}</p>`);
	}else if(posts[i].message == "undefined" && posts[i].thread != "undefined"){//メッセージの中身がなく、threadの中身があった場合、thread名を新たに追加
		if(thread_name.indexOf(posts[i].thread) == -1){
			thread_name.push(posts[i].thread);
			thread_contents.push([]);
			l.push(thread_name.length-1);
		}
		previous_thread = posts[i].thread;
	}else if(posts[i].message != "undefined" && posts[i].thread != "undefined"){
		thread_contents[thread_name.indexOf(posts[i].thread)].push(`<li>${escapeHTML(posts[i].message)}</li>`);
	}
  }
  //
  let messages = [];
  for(let i = 0;i < l.length;i++){
	  if(typeof l[i] == 'number'){
		messages.push(`<p>${escapeHTML(thread_name[l[i]])}</p>`);
		for(let j = 0;j < thread_contents[l[i]].length;j++){
		  messages.push(thread_contents[l[i]][j]);
		}
	  }else{
		messages.push(l[i]);
	  }
  }
  const html_ = template.replace(
    "<!-- posts -->",
	messages.join("")
	 );
  /*
  let html__;
  if(thread_name.length == 0){
	html__ = html_.replace(
    "<!-- thread list -->",
	`<a>${escapeHTML(previous_thread)}</a>`
    );
  }else{
	`<a>${escapeHTML(previous_thread)}</a>`	
  }
  */
  const html__ = html_.replace(
    "<!-- thread list -->",
	`<p>${escapeHTML("現在のthread: "+ previous_thread)}</p>`
  );


  //console.log(posts.thread);
  /*
  let dropDown = [];
  for(let i = 0;i < thread_name.length;i++){
	  dropDown[i] = `<option value='${escapeHTML(thread_name[i])}'>${escapeHTML(thread_name[i])}</option>`
  }
  let html__;
  if(dropDown.length != 0){
    let dropDownDisplay = "";
	dropDownDisplay = dropDown.join("");
	html__ = html_.replace(
    "<!-- drop down test -->",
    dropDownDisplay
    );
  }else{
	html__ = html_;
  }
  const html = html__;*/
 const html = html__ // 後で削除
    response.send(html);
});

app.post("/send", async (request, response) => {
  let thread_tmp = previous_thread;
  if(request.body.thread != undefined){
	  thread_tmp = request.body.thread;
	  previous_thread = thread_tmp;
  }
  let message_tmp = "undefined";
  if(request.body.message != undefined){
	  message_tmp  = request.body.message;
  }
  console.log(request.body.thread);
  console.log(request.body.message);
  await prisma.post.create({
    data: { message: message_tmp,
			thread: thread_tmp,
	},
  });
  response.redirect("/");
  
});



app.listen(3000);
