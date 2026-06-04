const COURSE = {
  id: "mobile_app_001",
  name: "移动互联传播与 APP 应用",
  time: "周三 09:55 — 12:20",
  room: "1003-3102",
  weeks: "1—17周",
  teacher: "张可",
  audience: "面向学院内选课学生",
  desc: "本课程围绕移动互联传播场景与 APP 应用实践展开，课堂中通过签到、投票等方式完成轻量互动。"
};

const DEFAULT_USERS = [
  { role: "teacher", account: "T2026001", realName: "张可", password: "123456", majorClass: "" },
  { role: "student", account: "2023123456", realName: "李静", password: "123456", majorClass: "2023级新闻班" }
];

const DEFAULT_STUDENTS = [
  { account: "2023123456", realName: "李静", majorClass: "2023级新闻班", signed: false, voted: false, called: false },
  { account: "202311001", realName: "李明轩", majorClass: "2023级广告班", signed: false, voted: false, called: false },
  { account: "202311002", realName: "陈雨桐", majorClass: "2023级新闻班", signed: false, voted: false, called: false },
  { account: "202311003", realName: "王一诺", majorClass: "2023级广告班", signed: false, voted: false, called: false },
  { account: "202311004", realName: "赵嘉禾", majorClass: "2023级新闻班", signed: false, voted: false, called: false },
  { account: "202311005", realName: "周安然", majorClass: "2023级广告班", signed: false, voted: false, called: false }
];

const state = {
  roleTab: "student",
  registerRole: "student",
  currentUser: null,
  selectedOption: null,
  page: "login"
};

const app = document.getElementById("app");
const userArea = document.getElementById("userArea");
const displayName = document.getElementById("displayName");
const avatarText = document.getElementById("avatarText");

function initStorage() {
  if (!localStorage.getItem("qingke_v5_users")) {
    localStorage.setItem("qingke_v5_users", JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem("qingke_v5_students")) {
    localStorage.setItem("qingke_v5_students", JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem("qingke_v5_class_active")) {
    localStorage.setItem("qingke_v5_class_active", "false");
  }
  if (!localStorage.getItem("qingke_v5_sign_active")) {
    localStorage.setItem("qingke_v5_sign_active", "false");
  }
  if (!localStorage.getItem("qingke_v5_called_account")) {
    localStorage.setItem("qingke_v5_called_account", "");
  }
  if (!localStorage.getItem("qingke_v5_poll")) {
    localStorage.setItem("qingke_v5_poll", JSON.stringify(null));
  }
}

function getUsers() {
  return JSON.parse(localStorage.getItem("qingke_v5_users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("qingke_v5_users", JSON.stringify(users));
}

function getStudents() {
  return JSON.parse(localStorage.getItem("qingke_v5_students") || "[]");
}

function saveStudents(students) {
  localStorage.setItem("qingke_v5_students", JSON.stringify(students));
}

function getClassActive() {
  return localStorage.getItem("qingke_v5_class_active") === "true";
}

function setClassActive(v) {
  localStorage.setItem("qingke_v5_class_active", String(v));
  if (!v) setSignActive(false);
}

function getSignActive() {
  return localStorage.getItem("qingke_v5_sign_active") === "true";
}

function setSignActive(v) {
  localStorage.setItem("qingke_v5_sign_active", String(v));
}

function getCalledAccount() {
  return localStorage.getItem("qingke_v5_called_account") || "";
}

function setCalledAccount(account) {
  localStorage.setItem("qingke_v5_called_account", account || "");
}

function getPoll() {
  return JSON.parse(localStorage.getItem("qingke_v5_poll") || "null");
}

function savePoll(poll) {
  localStorage.setItem("qingke_v5_poll", JSON.stringify(poll));
}

function familyName(name = "用户") {
  const compound = ["欧阳", "司马", "上官", "诸葛", "东方", "尉迟", "公孙", "夏侯"];
  return compound.find(s => name.startsWith(s)) || name.slice(0, 1);
}

function syncUserArea() {
  if (!state.currentUser) {
    userArea.classList.add("hidden");
    return;
  }
  userArea.classList.remove("hidden");
  avatarText.textContent = familyName(state.currentUser.realName);
  displayName.textContent = state.currentUser.role === "teacher" ? "老师" : "同学";
}

function setPage(page) {
  state.page = page;
  syncUserArea();
  render();
}

function goHome() {
  if (!state.currentUser) return setPage("login");
  setPage(state.currentUser.role === "teacher" ? "teacher" : "student");
}

function logout() {
  state.currentUser = null;
  state.selectedOption = null;
  setPage("login");
}

function render() {
  syncUserArea();
  if (state.page === "login") return renderLogin();
  if (state.page === "register") return renderRegister();
  if (state.page === "student") return renderStudent();
  if (state.page === "teacher") return renderTeacher();
  if (state.page === "scan") return renderScan();
  if (state.page === "success") return renderSuccess();
  if (state.page === "courseDetail") return renderCourseDetail();
  if (state.page === "pollCreate") return renderPollCreate();
  if (state.page === "studentManage") return renderStudentManage();
}

function renderLogin() {
  app.innerHTML = `
    <section class="auth-wrap">
      <div class="auth-card">
        <h1>欢迎进入轻课</h1>
        <p class="desc">为《${COURSE.name}》设计的轻量级课堂互动平台</p>
        <div class="role-tabs">
          <button class="role-tab ${state.roleTab === "student" ? "active" : ""}" onclick="state.roleTab='student'; renderLogin()">🎓 学生登录</button>
          <button class="role-tab ${state.roleTab === "teacher" ? "active" : ""}" onclick="state.roleTab='teacher'; renderLogin()">👨‍🏫 教师登录</button>
        </div>
        <div class="form">
          <label class="field"><span>👤</span><input id="loginAccount" placeholder="学号 / 工号" autocomplete="username"></label>
          <label class="field"><span>🔒</span><input id="loginPassword" placeholder="密码" type="password" autocomplete="current-password"></label>
          <button class="primary-btn" onclick="login()">进入课堂</button>
          <div class="auth-helper">🛡️ 需同时输入账号与密码后登录</div>
          <div id="loginAlert" class="alert"></div>
          <div class="auth-switch">没有账号？<button onclick="state.registerRole=state.roleTab; setPage('register')">立即注册</button></div>
        </div>
      </div>
    </section>
  `;
}

function renderRegister() {
  app.innerHTML = `
    <section class="auth-wrap">
      <div class="auth-card">
        <h1>欢迎注册轻课</h1>
        <p class="desc">创建本课程课堂互动账号</p>
        <div class="role-tabs">
          <button class="role-tab ${state.registerRole === "student" ? "active" : ""}" onclick="state.registerRole='student'; renderRegister()">🎓 学生注册</button>
          <button class="role-tab ${state.registerRole === "teacher" ? "active" : ""}" onclick="state.registerRole='teacher'; renderRegister()">👨‍🏫 教师注册</button>
        </div>
        <div class="form">
          <label class="field"><span>👤</span><input id="regAccount" placeholder="${state.registerRole === "student" ? "学号" : "工号"}"></label>
          <label class="field"><span>🪪</span><input id="regName" placeholder="真实姓名"></label>
          ${state.registerRole === "student" ? `<label class="field"><span>🏷️</span><input id="regMajorClass" placeholder="专业班级，例如：2023级新闻班"></label>` : ""}
          <label class="field"><span>🔒</span><input id="regPassword" placeholder="密码" type="password"></label>
          <label class="field"><span>🔐</span><input id="regPassword2" placeholder="确认密码" type="password"></label>
          <button class="primary-btn" onclick="register()">立即注册</button>
          <div id="regAlert" class="alert"></div>
          <div class="auth-switch">已有账号？<button onclick="setPage('login')">去登录</button></div>
        </div>
      </div>
    </section>
  `;
}

function login() {
  const account = document.getElementById("loginAccount").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const alert = document.getElementById("loginAlert");

  if (!account || !password) {
    alert.textContent = "请输入账号和密码";
    return;
  }

  const user = getUsers().find(u => u.role === state.roleTab && u.account === account && u.password === password);
  if (!user) {
    alert.textContent = "账号或密码错误，请检查后重试";
    return;
  }

  if (user.role === "student") {
    const inList = getStudents().some(s => s.account === user.account);
    if (!inList) {
      alert.textContent = "该学号暂未加入本课程名单，请联系任课老师";
      return;
    }
  }

  state.currentUser = user;
  setPage(user.role === "teacher" ? "teacher" : "student");
}

function register() {
  const account = document.getElementById("regAccount").value.trim();
  const realName = document.getElementById("regName").value.trim();
  const majorClass = state.registerRole === "student" ? document.getElementById("regMajorClass").value.trim() : "";
  const password = document.getElementById("regPassword").value.trim();
  const password2 = document.getElementById("regPassword2").value.trim();
  const alert = document.getElementById("regAlert");

  if (!account || !realName || !password || !password2 || (state.registerRole === "student" && !majorClass)) {
    alert.textContent = "请完整填写注册信息";
    return;
  }
  if (password !== password2) {
    alert.textContent = "两次输入的密码不一致";
    return;
  }

  const users = getUsers();
  if (users.some(u => u.account === account)) {
    alert.textContent = "该学号/工号已注册";
    return;
  }

  const user = { role: state.registerRole, account, realName, password, majorClass };
  users.push(user);
  saveUsers(users);

  if (state.registerRole === "student") {
    const students = getStudents();
    if (!students.some(s => s.account === account)) {
      students.push({ account, realName, majorClass, signed: false, voted: false, called: false });
      saveStudents(students);
    }
  }

  state.roleTab = state.registerRole;
  alert.style.color = "var(--green-dark)";
  alert.textContent = "注册成功，请返回登录";
}


function courseTeacherName() {
  if (state.currentUser && state.currentUser.role === "teacher") return state.currentUser.realName;
  return COURSE.teacher;
}

function courseCard(showStats = false, showDetailButton = true) {
  const students = getStudents();
  const signed = students.filter(s => s.signed).length;
  const voted = students.filter(s => s.voted).length;
  const total = students.length;
  const classActive = getClassActive();
  return `
    <section class="course-card">
      <div class="course-icon">📖</div>
      <div>
        <h2>${COURSE.name} <span class="badge ${classActive ? "" : "gray"}">${classActive ? "上课中" : "待上课"}</span></h2>
        <div class="meta">
          <span>🕙 ${COURSE.time}</span>
          <span>🏫 教室 ${COURSE.room}</span>
          <span>📅 授课时间 ${COURSE.weeks}</span>
        </div>
      </div>
      ${showStats ? `
      <div class="stats">
        <div class="stat"><div class="label">课程学生</div><div class="num">${total}</div></div>
        <div class="stat"><div class="label">已签到</div><div class="num">${signed}</div></div>
        <div class="stat"><div class="label">投票参与率</div><div class="num">${percent(voted,total)}%</div></div>
      </div>` : `<button class="ghost-btn" onclick="setPage('courseDetail')">查看课程详情</button>`}
    </section>
  `;
}

function currentStudent() {
  return getStudents().find(s => s.account === state.currentUser.account) || {
    account: state.currentUser.account,
    realName: state.currentUser.realName,
    majorClass: state.currentUser.majorClass || "",
    signed: false,
    voted: false,
    called: false
  };
}

function renderStudent() {
  const me = currentStudent();
  const signActive = getSignActive();
  const classActive = getClassActive();
  const poll = getPoll();

  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>学生首页</h1>
        <p>欢迎回来，开始今天的课堂互动</p>
      </div>

    </section>
    ${courseCard(false, false)}
    <section class="grid-3">
      <article class="card">
        <div class="card-head">
          <div class="round-icon">✅</div>
          <div><h3>课堂签到</h3><p class="small">${signText(me, signActive, classActive)}</p></div>
        </div>
        <div class="center-box">
          <div>
            <span class="badge ${classActive ? "" : "gray"}">${classActive ? "上课中" : "待上课"}</span>
            <div class="big-status">${me.signed ? "已签到" : (signActive ? "签到进行中" : "待发布")}</div>
            <p class="small">${me.signed ? "签到时间：09:58" : "老师发布签到后，可一键完成签到"}</p>
          </div>
        </div>
        <button class="primary-btn ${me.signed ? "secondary-btn" : ""}" onclick="oneClickSign()" ${(!classActive || !signActive || me.signed) ? "disabled" : ""}>
          ${me.signed ? "已完成签到" : (signActive ? "一键签到" : "等待老师发起签到")}
        </button>
      </article>

      <article class="card">
        <div class="card-head">
          <div class="round-icon blue">📊</div>
          <div><h3>课堂投票</h3><p class="small">${poll ? "当前有投票进行中" : "老师发布后可参与投票"}</p></div>
        </div>
        ${poll ? studentPollHTML(poll, me) : `
          <div class="center-box">
            <div>
              <div class="big-status">暂无投票</div>
              <p class="small">请等待老师创建并发布投票</p>
            </div>
          </div>
        `}
      </article>

      <aside>
        <article class="card">
          <div class="card-head">
            <div class="round-icon">〽️</div>
            <div><h3>我的课堂状态</h3><p class="small">完成后小圆点会变为绿色</p></div>
          </div>
          <div class="status-list">
            <div class="status-row"><span>上课状态</span><span class="dot ${classActive ? "done" : ""}">${classActive ? "上课中" : "待上课"}</span></div>
            <div class="status-row"><span>签到状态</span><span class="dot ${me.signed ? "done" : ""}">${me.signed ? "已签到" : "未签到"}</span></div>
            <div class="status-row"><span>投票状态</span><span class="dot ${me.voted ? "done" : ""}">${me.voted ? "已投票" : "未投票"}</span></div>
            <div class="status-row"><span>是否被点名</span><span class="dot ${me.called ? "done" : ""}">${me.called ? "已点名" : "未点名"}</span></div>
          </div>
        </article>
        <article class="card" style="margin-top:20px;">
          <div class="card-head">
            <div class="round-icon yellow">🪪</div>
            <div><h3>学生信息</h3><p class="small">用于课程名单匹配</p></div>
          </div>
          <div class="status-list">
            <div class="status-row"><span>姓名</span><b>${me.realName}</b></div>
            <div class="status-row"><span>学号</span><b>${me.account}</b></div>
            <div class="status-row"><span>专业班级</span><b>${me.majorClass || "未填写"}</b></div>
          </div>
        </article>
      </aside>
    </section>
  `;
}

function signText(me, signActive, classActive) {
  if (!classActive) return "当前待上课，签到未开放";
  if (me.signed) return "你已完成本节课签到";
  if (signActive) return "老师已发布签到，请点击按钮完成";
  return "等待老师发布本节课签到";
}

function studentPollHTML(poll, me) {
  if (me.voted) {
    return `
      <b>${poll.question}</b>
      <p class="small">你已提交投票，以下为实时结果</p>
      ${pollResultsHTML(poll)}
    `;
  }
  return `
    <b>${poll.question}</b>
    <p class="small">单选 · 匿名投票</p>
    <div class="poll-options">
      ${poll.options.map((t,i)=>`
        <div class="option ${state.selectedOption===i ? "selected" : ""}" onclick="selectOption(${i})">
          <span class="letter">${String.fromCharCode(65+i)}</span>${escapeHTML(t)}
        </div>`).join("")}
    </div>
    <button class="primary-btn" onclick="submitVote()">提交投票</button>
    <button class="text-btn" onclick="showStudentResults()">查看实时结果 ›</button>
    <div id="voteResult"></div>
  `;
}

function renderTeacher() {
  const students = getStudents();
  const signed = students.filter(s => s.signed).length;
  const voted = students.filter(s => s.voted).length;
  const total = students.length;
  const called = students.find(s => s.account === getCalledAccount());
  const signActive = getSignActive();
  const classActive = getClassActive();
  const poll = getPoll();

  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>教师控制台</h1>
        <p>快速组织本节课堂互动</p>
      </div>
      <div class="page-actions">
        <button class="${classActive ? "danger-btn" : "primary-btn"}" onclick="toggleClass()">${classActive ? "结束上课" : "开始上课"}</button>
        <button class="ghost-btn" onclick="setPage('courseDetail')">查看课程详情</button>
      </div>
    </section>
    ${courseCard(true)}
    <section class="grid-3">
      <article class="card">
        <div class="card-head">
          <div class="round-icon">✅</div>
          <div><h3>签到管理</h3><p class="small">老师发布签到后，学生端一键签到同步开启</p></div>
        </div>
        <div class="center-box">
          <div>
            <span class="badge ${!classActive ? "gray" : (signActive ? "" : "yellow")}">${!classActive ? "需先开始上课" : (signActive ? "签到进行中" : "待发布")}</span>
            <div class="big-status">${signed} / ${total}</div>
            <p class="small">${signActive ? "学生端“一键签到”按钮已同步开启" : "发布后学生端将出现可点击签到按钮"}</p>
          </div>
        </div>
        <div class="action-row">
          <button class="primary-btn" onclick="toggleSign()" ${!classActive ? "disabled" : ""}>${signActive ? "结束签到" : "发布签到"}</button>
          <button class="secondary-btn" onclick="resetSignOnly()">重置签到</button>
        </div>
      </article>

      <article class="card">
        <div class="card-head">
          <div class="round-icon blue">🎲</div>
          <div><h3>随机点名</h3><p class="small">从当前课程名单中随机抽取</p></div>
        </div>
        <div class="center-box">
          <div>
            <p class="small">本次抽取结果</p>
            <div class="big-status">${called ? called.realName : "暂未抽取"}</div>
            <p class="small">${called ? "学号：" + called.account + " · " + (called.majorClass || "") : "请先在名单管理中导入学生"}</p>
          </div>
        </div>
        <button class="primary-btn" onclick="drawStudent()" ${!classActive ? "disabled" : ""}>开始抽取</button>
      </article>

      <article class="card">
        <div class="card-head">
          <div class="round-icon blue">📊</div>
          <div><h3>投票管理</h3><p class="small">可创建问题并自由设置选项</p></div>
        </div>
        ${poll ? `
          <b>${escapeHTML(poll.question)}</b>
          <p class="small">已发布 · 实时结果显示</p>
          ${pollResultsHTML(poll)}
          <div class="action-row">
            <button class="secondary-btn" onclick="setPage('pollCreate')">重新创建</button>
            <button class="danger-btn" onclick="clearPoll()">结束投票</button>
          </div>
        ` : `
          <div class="center-box">
            <div>
              <div class="big-status">暂无投票</div>
              <p class="small">点击创建投票，输入问题和至少两个选项</p>
            </div>
          </div>
          <button class="primary-btn" onclick="setPage('pollCreate')" ${!classActive ? "disabled" : ""}>创建投票</button>
        `}
      </article>
    </section>

    <section class="grid-2" style="margin-top:20px;">
      <article class="card">
        <div class="card-head">
          <div class="round-icon mint">👥</div>
          <div><h3>学生名单管理</h3><p class="small">导入姓名、学号、专业班级；退课仅教师端可操作</p></div>
        </div>
        <div class="center-box">
          <div>
            <div class="big-status">${total} 人</div>
            <p class="small">当前课程名单。点名、签到、投票均以此名单为准。</p>
          </div>
        </div>
        <button class="primary-btn" onclick="setPage('studentManage')">管理名单</button>
      </article>

      <article class="course-card dashboard-overview" style="margin:0;">
        <div>
          <h2>本节概览</h2>
          <p class="small">课堂数据实时汇总</p>
        </div>
        <div class="overview-metrics">
          <div class="metric"><div class="round-icon">✅</div><div><b>${percent(signed,total)}%</b><div class="small">签到率 ${signed}/${total}</div></div></div>
          <div class="metric"><div class="round-icon mint">◔</div><div><b>${percent(voted,total)}%</b><div class="small">投票参与率 ${voted}/${total}</div></div></div>
          <div class="metric"><div class="round-icon blue">👤</div><div><b>${called ? "1" : "0"}次</b><div class="small">点名次数</div></div></div>
        </div>
      </article>
    </section>
  `;
}

function renderCourseDetail() {
  const classActive = getClassActive();
  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>课程详情</h1>
        <p>本原型仅服务于《${COURSE.name}》这门课程</p>
      </div>
      <div class="page-actions">
        <button class="ghost-btn" onclick="goHome()">返回首页</button>
      </div>
    </section>
    <section class="grid-2">
      <article class="card">
        <div class="card-head">
          <div class="round-icon">📖</div>
          <div><h3>课程信息</h3><p class="small">用于课堂签到、投票与名单管理</p></div>
        </div>
        <div class="detail-list">
          <div class="detail-item"><b>课程名称</b><span>${COURSE.name}</span></div>
          <div class="detail-item"><b>上课时间</b><span>${COURSE.time}</span></div>
          <div class="detail-item"><b>教室</b><span>${COURSE.room}</span></div>
          <div class="detail-item"><b>授课时间</b><span>${COURSE.weeks}</span></div>
          <div class="detail-item"><b>任课教师</b><span>${courseTeacherName()}</span></div>
          <div class="detail-item"><b>课程对象</b><span>${COURSE.audience}</span></div>
          <div class="detail-item"><b>课堂状态</b><span><span class="badge ${classActive ? "" : "gray"}">${classActive ? "上课中" : "待上课"}</span></span></div>
        </div>
      </article>
      <article class="card">
        <div class="card-head">
          <div class="round-icon blue">💡</div>
          <div><h3>轻课网页说明</h3><p class="small">课堂互动网页使用说明</p></div>
        </div>
        <p style="line-height:1.9;color:var(--muted);">${COURSE.desc}</p>
        
      </article>
    </section>
  `;
}

function renderPollCreate() {
  const poll = getPoll();
  const options = poll ? poll.options : ["", ""];
  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>创建投票</h1>
        <p>老师可输入问题，并自由设置两个以上选项</p>
      </div>
      <div class="page-actions">
        <button class="ghost-btn" onclick="setPage('teacher')">返回控制台</button>
      </div>
    </section>
    <section class="card" style="max-width:760px;margin:0 auto;">
      <div class="form">
        <label class="field"><span>❓</span><input id="pollQuestion" placeholder="请输入投票问题" value="${poll ? escapeAttr(poll.question) : ""}"></label>
        <div id="optionEditor" class="option-editor">
          ${options.map((op,i)=> optionInputHTML(i, op)).join("")}
        </div>
        <div class="action-row">
          <button class="secondary-btn" onclick="addOptionInput()">添加选项</button>
          <button class="secondary-btn" onclick="removeOptionInput()">删除选项</button>
          <button class="danger-btn" onclick="clearPollForm()">一键清空</button>
        </div>
        <button class="primary-btn" onclick="publishPoll()">发布投票</button>
        <div id="pollCreateAlert" class="alert"></div>
      </div>
    </section>
  `;
}

function optionInputHTML(i, value="") {
  return `<label class="field option-input"><span>${String.fromCharCode(65+i)}</span><input placeholder="选项 ${String.fromCharCode(65+i)}" value="${escapeAttr(value)}"></label>`;
}

function addOptionInput() {
  const box = document.getElementById("optionEditor");
  const count = box.querySelectorAll(".option-input").length;
  if (count >= 6) {
    alert("最多设置 6 个选项");
    return;
  }
  box.insertAdjacentHTML("beforeend", optionInputHTML(count, ""));
}

function removeOptionInput() {
  const box = document.getElementById("optionEditor");
  const items = box.querySelectorAll(".option-input");
  if (items.length <= 2) {
    alert("至少保留 2 个选项");
    return;
  }
  items[items.length - 1].remove();
}


function clearPollForm() {
  document.getElementById("pollQuestion").value = "";
  const box = document.getElementById("optionEditor");
  box.innerHTML = optionInputHTML(0, "") + optionInputHTML(1, "");
  const alertBox = document.getElementById("pollCreateAlert");
  if (alertBox) {
    alertBox.style.color = "var(--green-dark)";
    alertBox.textContent = "已清空问题和选项";
  }
}

function publishPoll() {
  const question = document.getElementById("pollQuestion").value.trim();
  const optionInputs = [...document.querySelectorAll("#optionEditor input")];
  const options = optionInputs.map(i => i.value.trim()).filter(Boolean);
  const alertBox = document.getElementById("pollCreateAlert");

  if (!question) {
    alertBox.textContent = "请输入投票问题";
    return;
  }
  if (options.length < 2) {
    alertBox.textContent = "至少需要设置两个选项";
    return;
  }

  const students = getStudents().map(s => ({...s, voted:false}));
  saveStudents(students);

  const poll = {
    id: Date.now(),
    question,
    options,
    counts: options.map(() => 0),
    active: true
  };
  savePoll(poll);
  state.selectedOption = null;
  setPage("teacher");
}

function renderStudentManage() {
  const students = getStudents();
  const sample = `李静,2023123456,2023级新闻班
李明轩,2023123457,2023级广告班
陈雨桐,2023123458,2023级新闻班`;
  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>学生名单管理</h1>
        <p>导入本课程学生名单，用于登录匹配、签到统计和随机点名</p>
      </div>
      <div class="page-actions">
        <button class="ghost-btn" onclick="setPage('teacher')">返回控制台</button>
      </div>
    </section>
    <section class="grid-2">
      <article class="card">
        <div class="card-head">
          <div class="round-icon">➕</div>
          <div><h3>手动添加学生</h3><p class="small">姓名、学号、专业班级</p></div>
        </div>
        <div class="form">
          <label class="field"><span>🪪</span><input id="oneName" placeholder="姓名"></label>
          <label class="field"><span>👤</span><input id="oneAccount" placeholder="学号"></label>
          <label class="field"><span>🏷️</span><input id="oneMajorClass" placeholder="专业班级，例如：2023级新闻班"></label>
          <button class="primary-btn" onclick="addOneStudent()">添加学生</button>
          <div id="studentManageAlert" class="alert"></div>
        </div>
      </article>

      <article class="card">
        <div class="card-head">
          <div class="round-icon blue">📥</div>
          <div><h3>批量导入名单</h3><p class="small">每行格式：姓名,学号,专业班级</p></div>
        </div>
        <div class="form">
          <label class="field textarea-field"><span>📋</span><textarea id="batchText" placeholder="${sample}"></textarea></label>
          <button class="primary-btn" onclick="batchImportStudents()">导入名单</button>
          <button class="secondary-btn" onclick="fillSample()">填入示例</button>
        </div>
      </article>
    </section>

    <section class="card" style="margin-top:20px;">
      <div class="card-head">
        <div class="round-icon mint">👥</div>
        <div><h3>当前课程名单</h3><p class="small">共 ${students.length} 人</p></div>
      </div>
      <table class="list-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>学号</th>
            <th>专业班级</th>
            <th>签到状态</th>
            <th>投票状态</th>
            <th>管理</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td>${escapeHTML(s.realName)}</td>
              <td>${escapeHTML(s.account)}</td>
              <td>${escapeHTML(s.majorClass || "")}</td>
              <td><span class="dot ${s.signed ? "done" : ""}">${s.signed ? "已签到" : "未签到"}</span></td>
              <td><span class="dot ${s.voted ? "done" : ""}">${s.voted ? "已投票" : "未投票"}</span></td>
              <td><button class="danger-btn tiny-btn" onclick="removeStudent('${escapeAttr(s.account)}')">删除</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}


function removeStudent(account) {
  const students = getStudents();
  const target = students.find(s => s.account === account);
  if (!target) return;
  if (!confirm(`确认将 ${target.realName} 从本课程名单中删除吗？该操作表示中途退课，仅教师端可执行。`)) return;
  const next = students.filter(s => s.account !== account);
  saveStudents(next);
  if (getCalledAccount() === account) setCalledAccount("");
  renderStudentManage();
}

function fillSample() {
  document.getElementById("batchText").value = `李静,2023123456,2023级新闻班
李明轩,2023123457,2023级广告班
陈雨桐,2023123458,2023级新闻班`;
}

function addOneStudent() {
  const name = document.getElementById("oneName").value.trim();
  const account = document.getElementById("oneAccount").value.trim();
  const majorClass = document.getElementById("oneMajorClass").value.trim();
  const alertBox = document.getElementById("studentManageAlert");
  if (!name || !account || !majorClass) {
    alertBox.textContent = "请完整填写学生信息";
    return;
  }
  upsertStudent({realName:name, account, majorClass});
  alertBox.style.color = "var(--green-dark)";
  alertBox.textContent = "添加成功";
  renderStudentManage();
}

function batchImportStudents() {
  const text = document.getElementById("batchText").value.trim();
  if (!text) {
    alert("请先输入名单内容");
    return;
  }
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let ok = 0;
  lines.forEach(line => {
    const parts = line.split(/[,，\s]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      upsertStudent({ realName: parts[0], account: parts[1], majorClass: parts.slice(2).join("") });
      ok++;
    }
  });
  alert(`已导入 ${ok} 条学生信息。新导入学生默认密码为 123456`);
  renderStudentManage();
}

function upsertStudent(newStudent) {
  const students = getStudents();
  const old = students.find(s => s.account === newStudent.account);
  if (old) {
    old.realName = newStudent.realName;
    old.majorClass = newStudent.majorClass;
  } else {
    students.push({ ...newStudent, signed:false, voted:false, called:false });
  }
  saveStudents(students);

  const users = getUsers();
  const oldUser = users.find(u => u.account === newStudent.account);
  if (oldUser) {
    oldUser.realName = newStudent.realName;
    oldUser.majorClass = newStudent.majorClass;
  } else {
    users.push({ role:"student", account:newStudent.account, realName:newStudent.realName, majorClass:newStudent.majorClass, password:"123456" });
  }
  saveUsers(users);
}

function qrBlock(signed, total) {
  return `
    <div class="qr-wrap">
      <div class="timer">扫码签到中 · 02:59</div>
      <div class="qr">${Array.from({length:81}, (_,i)=>`<i class="${(i*7+i%5)%3===0 || [0,1,2,9,18,10,20,60,70,80,72,62].includes(i) ? "dark" : ""}"></i>`).join("")}</div>
      <div class="big-status">${signed} / ${total}</div>
      <p class="small">教室大屏展示二维码，学生端“扫一扫签到”按钮同步开启</p>
    </div>
  `;
}

function renderScan() {
  const signActive = getSignActive();
  const classActive = getClassActive();
  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>扫码签到</h1>
        <p>请扫描教师端展示的签到二维码</p>
      </div>
      <button class="ghost-btn" onclick="setPage('student')">返回首页</button>
    </section>
    <section class="card" style="max-width:620px;margin:0 auto;text-align:center;">
      <div class="scan-frame"><span>▦</span></div>
      <p class="small">${classActive && signActive ? "已检测到本节课签到二维码" : "当前未开放签到，暂时无法完成签到"}</p>
      <div class="action-row">
        <button class="secondary-btn" onclick="setPage('student')">返回首页</button>
        <button class="primary-btn" onclick="mockScan()" ${(classActive && signActive) ? "" : "disabled"}>模拟扫码签到</button>
      </div>
    </section>
  `;
}

function renderSuccess() {
  app.innerHTML = `
    <section class="auth-wrap">
      <div class="auth-card" style="text-align:center;">
        <div class="success-mark">✓</div>
        <h1>签到成功</h1>
        <p class="desc">你已完成《${COURSE.name}》本节课签到</p>
        <button class="primary-btn" onclick="setPage('student')">返回学生首页</button>
      </div>
    </section>
  `;
}


function oneClickSign() {
  if (!getClassActive() || !getSignActive()) {
    alert("老师尚未发布签到");
    return;
  }
  const students = getStudents();
  const me = students.find(s => s.account === state.currentUser.account);
  if (me) {
    me.signed = true;
    saveStudents(students);
  }
  setPage("success");
}

function mockScan() {
  const students = getStudents();
  const me = students.find(s => s.account === state.currentUser.account);
  if (me) {
    me.signed = true;
    saveStudents(students);
  }
  setPage("success");
}

function toggleClass() {
  setClassActive(!getClassActive());
  renderTeacher();
}

function toggleSign() {
  if (!getClassActive()) return;
  setSignActive(!getSignActive());
  renderTeacher();
}

function resetSignOnly() {
  const students = getStudents().map(s => ({...s, signed:false}));
  saveStudents(students);
  setSignActive(false);
  renderTeacher();
}

function drawStudent() {
  const students = getStudents();
  if (!students.length) {
    alert("请先导入学生名单");
    return;
  }
  const pick = students[Math.floor(Math.random() * students.length)];
  students.forEach(s => s.called = s.account === pick.account);
  saveStudents(students);
  setCalledAccount(pick.account);
  renderTeacher();
}

function clearPoll() {
  savePoll(null);
  const students = getStudents().map(s => ({...s, voted:false}));
  saveStudents(students);
  state.selectedOption = null;
  renderTeacher();
}

function selectOption(i) {
  state.selectedOption = i;
  renderStudent();
}

function submitVote() {
  const poll = getPoll();
  if (!poll) return;
  if (state.selectedOption === null) {
    alert("请先选择一个投票选项");
    return;
  }
  const students = getStudents();
  const me = students.find(s => s.account === state.currentUser.account);
  if (me && !me.voted) {
    me.voted = true;
    saveStudents(students);
    poll.counts[state.selectedOption] += 1;
    savePoll(poll);
  }
  state.selectedOption = null;
  renderStudent();
}

function showStudentResults() {
  const poll = getPoll();
  const el = document.getElementById("voteResult");
  if (el && poll) el.innerHTML = `<div style="margin-top:18px;">${pollResultsHTML(poll)}</div>`;
}

function pollResultsHTML(poll) {
  const total = poll.counts.reduce((a,b)=>a+b,0) || 1;
  return poll.options.map((label,i)=>{
    const p = Math.round((poll.counts[i] || 0) / total * 100);
    return `
      <div class="result-row">
        <span>${String.fromCharCode(65+i)}. ${escapeHTML(label)}</span>
        <div class="bar"><span style="width:${p}%"></span></div>
        <span>${p}%（${poll.counts[i] || 0}人）</span>
      </div>
    `;
  }).join("");
}

function percent(a, b) {
  return b ? Math.round(a / b * 100) : 0;
}

function escapeHTML(str="") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function escapeAttr(str="") {
  return escapeHTML(str).replace(/"/g, "&quot;");
}

initStorage();
renderLogin();
