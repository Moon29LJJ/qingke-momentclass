const SUPABASE_URL = "https://fjfqmxaklxsfhpicnllk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_IWncfJDY94dslISYwLx8lQ_I-0K1XcN";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

const state = {
  roleTab: "student",
  registerRole: "student",
  currentUser: null,
  selectedOption: null,
  page: "login",
  cache: {
    users: [],
    students: [],
    courseState: null,
    poll: null,
    pollOptions: [],
    votes: []
  }
};

const app = document.getElementById("app");
const userArea = document.getElementById("userArea");
const displayName = document.getElementById("displayName");
const avatarText = document.getElementById("avatarText");

function familyName(name = "用户") {
  const compound = ["欧阳", "司马", "上官", "诸葛", "东方", "尉迟", "公孙", "夏侯"];
  return compound.find(s => name.startsWith(s)) || name.slice(0, 1);
}

function escapeHTML(str="") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function escapeAttr(str="") {
  return escapeHTML(str).replace(/"/g, "&quot;");
}

function percent(a, b) {
  return b ? Math.round(a / b * 100) : 0;
}

function syncUserArea() {
  if (!state.currentUser) {
    userArea.classList.add("hidden");
    return;
  }
  userArea.classList.remove("hidden");
  avatarText.textContent = familyName(state.currentUser.real_name);
  displayName.textContent = state.currentUser.role === "teacher" ? "老师" : "同学";
}

function saveSession() {
  if (state.currentUser) {
    sessionStorage.setItem("qingke_v6_user", JSON.stringify(state.currentUser));
  } else {
    sessionStorage.removeItem("qingke_v6_user");
  }
}

function loadSession() {
  const raw = sessionStorage.getItem("qingke_v6_user");
  if (!raw) return;
  try {
    state.currentUser = JSON.parse(raw);
  } catch (e) {
    state.currentUser = null;
  }
}

async function fetchAllData() {
  const [courseRes, studentsRes, pollRes, votesRes] = await Promise.all([
    db.from("course_state").select("*").eq("id", 1).single(),
    db.from("students").select("*").order("id", { ascending: true }),
    db.from("polls").select("*").eq("active", true).order("id", { ascending: false }).limit(1),
    db.from("votes").select("*")
  ]);

  if (courseRes.error) throw courseRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (pollRes.error && pollRes.error.code !== "PGRST116") throw pollRes.error;
  if (votesRes.error) throw votesRes.error;

  state.cache.courseState = courseRes.data;
  state.cache.students = studentsRes.data || [];
  state.cache.votes = votesRes.data || [];
  state.cache.poll = pollRes.data && pollRes.data.length ? pollRes.data[0] : null;
  state.cache.pollOptions = [];

  if (state.cache.poll) {
    const optionsRes = await db
      .from("poll_options")
      .select("*")
      .eq("poll_id", state.cache.poll.id)
      .order("sort_order", { ascending: true });
    if (optionsRes.error) throw optionsRes.error;
    state.cache.pollOptions = optionsRes.data || [];
  }
}

function showLoading(text = "正在连接轻课数据库…") {
  app.innerHTML = `
    <section class="auth-wrap">
      <div class="auth-card loading-box">
        <div>
          <h1>轻课 MomentClass</h1>
          <p class="desc">${text}</p>
          <p class="sync-note">如果长时间停留在此页面，请确认已在 Supabase 中执行 schema.sql。</p>
        </div>
      </div>
    </section>
  `;
}

function showError(err) {
  console.error(err);
  app.innerHTML = `
    <section class="auth-wrap">
      <div class="auth-card">
        <h1>连接失败</h1>
        <p class="desc">请检查 Supabase 数据表是否已创建，或网络是否可访问。</p>
        <div class="alert">${escapeHTML(err.message || String(err))}</div>
        <button class="primary-btn" onclick="location.reload()">重新加载</button>
      </div>
    </section>
  `;
}

async function setPage(page) {
  state.page = page;
  syncUserArea();
  showLoading();
  try {
    await fetchAllData();
    render();
  } catch (err) {
    showError(err);
  }
}

function goHome() {
  if (!state.currentUser) return setPage("login");
  setPage(state.currentUser.role === "teacher" ? "teacher" : "student");
}

function logout() {
  state.currentUser = null;
  state.selectedOption = null;
  saveSession();
  setPage("login");
}

function render() {
  syncUserArea();
  if (state.page === "login") return renderLogin();
  if (state.page === "register") return renderRegister();
  if (state.page === "student") return renderStudent();
  if (state.page === "teacher") return renderTeacher();
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
          <div class="auth-helper">🛡️ 数据已接入 Supabase，多人登录后共享课堂状态</div>
          <div id="loginAlert" class="alert"></div>
          <div class="auth-switch">没有账号？<button onclick="state.registerRole=state.roleTab; renderRegister()">立即注册</button></div>
        </div>
      </div>
    </section>
  `;
}

function renderRegister() {
  state.page = "register";
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
          <div class="auth-switch">已有账号？<button onclick="state.page='login'; renderLogin()">去登录</button></div>
        </div>
      </div>
    </section>
  `;
}

async function login() {
  const account = document.getElementById("loginAccount").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const alert = document.getElementById("loginAlert");

  if (!account || !password) {
    alert.textContent = "请输入账号和密码";
    return;
  }

  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("role", state.roleTab)
    .eq("account", account)
    .eq("password", password)
    .limit(1)
    .maybeSingle();

  if (error) {
    alert.textContent = error.message;
    return;
  }
  if (!data) {
    alert.textContent = "账号或密码错误，请检查后重试";
    return;
  }

  if (data.role === "student") {
    const { data: student, error: studentError } = await db
      .from("students")
      .select("*")
      .eq("account", account)
      .maybeSingle();

    if (studentError) {
      alert.textContent = studentError.message;
      return;
    }
    if (!student) {
      alert.textContent = "该学号暂未加入本课程名单，请联系任课老师";
      return;
    }
  }

  state.currentUser = data;
  saveSession();
  await setPage(data.role === "teacher" ? "teacher" : "student");
}

async function register() {
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

  const { error } = await db.from("users").insert({
    role: state.registerRole,
    account,
    real_name: realName,
    password,
    major_class: majorClass
  });

  if (error) {
    alert.textContent = error.message.includes("duplicate") ? "该学号/工号已注册" : error.message;
    return;
  }

  if (state.registerRole === "student") {
    await db.from("students").upsert({
      account,
      real_name: realName,
      major_class: majorClass,
      signed: false,
      voted: false,
      called: false
    }, { onConflict: "account" });
  }

  state.roleTab = state.registerRole;
  alert.style.color = "var(--green-dark)";
  alert.textContent = "注册成功，请返回登录";
}

function courseTeacherName() {
  if (state.currentUser && state.currentUser.role === "teacher") return state.currentUser.real_name;
  return state.cache.courseState?.current_teacher || COURSE.teacher;
}

function courseCard(showStats = false, showDetailButton = true) {
  const students = state.cache.students;
  const signed = students.filter(s => s.signed).length;
  const voted = students.filter(s => s.voted).length;
  const total = students.length;
  const classActive = state.cache.courseState?.class_active;
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
      </div>` : (showDetailButton ? `<button class="ghost-btn" onclick="setPage('courseDetail')">查看课程详情</button>` : `<span></span>`)}
    </section>
  `;
}

function currentStudent() {
  return state.cache.students.find(s => s.account === state.currentUser.account) || {
    account: state.currentUser.account,
    real_name: state.currentUser.real_name,
    major_class: state.currentUser.major_class || "",
    signed: false,
    voted: false,
    called: false
  };
}

function userHasVoted() {
  if (!state.cache.poll || !state.currentUser) return false;
  return state.cache.votes.some(v => v.poll_id === state.cache.poll.id && v.account === state.currentUser.account);
}

function renderStudent() {
  const me = currentStudent();
  const signActive = state.cache.courseState?.sign_active;
  const classActive = state.cache.courseState?.class_active;
  const poll = state.cache.poll;
  const hasVoted = userHasVoted();

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
            <p class="small">${me.signed ? "签到时间：" + (me.sign_time || "已记录") : "老师发布签到后，可一键完成签到"}</p>
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
        ${poll ? studentPollHTML(poll, hasVoted) : `
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
            <div class="status-row"><span>投票状态</span><span class="dot ${hasVoted ? "done" : ""}">${hasVoted ? "已投票" : "未投票"}</span></div>
            <div class="status-row"><span>是否被点名</span><span class="dot ${me.called ? "done" : ""}">${me.called ? "已点名" : "未点名"}</span></div>
          </div>
        </article>
        <article class="card" style="margin-top:20px;">
          <div class="card-head">
            <div class="round-icon yellow">🪪</div>
            <div><h3>学生信息</h3><p class="small">用于课程名单匹配</p></div>
          </div>
          <div class="status-list">
            <div class="status-row"><span>姓名</span><b>${escapeHTML(me.real_name)}</b></div>
            <div class="status-row"><span>学号</span><b>${escapeHTML(me.account)}</b></div>
            <div class="status-row"><span>专业班级</span><b>${escapeHTML(me.major_class || "未填写")}</b></div>
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

function studentPollHTML(poll, hasVoted) {
  if (hasVoted) {
    return `
      <b>${escapeHTML(poll.question)}</b>
      <p class="small">你已提交投票，以下为实时结果</p>
      ${pollResultsHTML()}
    `;
  }
  return `
    <b>${escapeHTML(poll.question)}</b>
    <p class="small">单选 · 匿名投票</p>
    <div class="poll-options">
      ${state.cache.pollOptions.map((op,i)=>`
        <div class="option ${state.selectedOption===op.id ? "selected" : ""}" onclick="selectOption(${op.id})">
          <span class="letter">${String.fromCharCode(65+i)}</span>${escapeHTML(op.option_text)}
        </div>`).join("")}
    </div>
    <button class="primary-btn" onclick="submitVote()">提交投票</button>
    <button class="text-btn" onclick="showStudentResults()">查看实时结果 ›</button>
    <div id="voteResult"></div>
  `;
}

async function oneClickSign() {
  if (!state.cache.courseState?.class_active || !state.cache.courseState?.sign_active) {
    alert("老师尚未发布签到");
    return;
  }
  const now = new Date().toLocaleString("zh-CN");
  const { error } = await db
    .from("students")
    .update({ signed: true, sign_time: now })
    .eq("account", state.currentUser.account);

  if (error) {
    alert(error.message);
    return;
  }
  await setPage("success");
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

function renderTeacher() {
  const students = state.cache.students;
  const signed = students.filter(s => s.signed).length;
  const voted = students.filter(s => s.voted).length;
  const total = students.length;
  const called = students.find(s => s.called);
  const signActive = state.cache.courseState?.sign_active;
  const classActive = state.cache.courseState?.class_active;
  const poll = state.cache.poll;

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
            <div class="big-status">${called ? escapeHTML(called.real_name) : "暂未抽取"}</div>
            <p class="small">${called ? "学号：" + escapeHTML(called.account) + " · " + escapeHTML(called.major_class || "") : "请先在名单管理中导入学生"}</p>
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
          ${pollResultsHTML()}
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

async function toggleClass() {
  const current = !!state.cache.courseState?.class_active;
  const payload = {
    class_active: !current,
    sign_active: current ? false : state.cache.courseState?.sign_active,
    current_teacher: state.currentUser.real_name
  };
  const { error } = await db.from("course_state").update(payload).eq("id", 1);
  if (error) return alert(error.message);
  await setPage("teacher");
}

async function toggleSign() {
  if (!state.cache.courseState?.class_active) return;
  const { error } = await db
    .from("course_state")
    .update({ sign_active: !state.cache.courseState.sign_active })
    .eq("id", 1);
  if (error) return alert(error.message);
  await setPage("teacher");
}

async function resetSignOnly() {
  const { error } = await db.from("students").update({ signed: false, sign_time: null }).neq("account", "__none__");
  if (error) return alert(error.message);
  await db.from("course_state").update({ sign_active: false }).eq("id", 1);
  await setPage("teacher");
}

async function drawStudent() {
  const students = state.cache.students;
  if (!students.length) return alert("请先导入学生名单");
  const pick = students[Math.floor(Math.random() * students.length)];
  await db.from("students").update({ called: false }).neq("account", "__none__");
  const { error } = await db.from("students").update({ called: true }).eq("account", pick.account);
  if (error) return alert(error.message);
  await setPage("teacher");
}

async function clearPoll() {
  if (!state.cache.poll) return;
  await db.from("votes").delete().eq("poll_id", state.cache.poll.id);
  await db.from("poll_options").delete().eq("poll_id", state.cache.poll.id);
  const { error } = await db.from("polls").delete().eq("id", state.cache.poll.id);
  if (error) return alert(error.message);
  await db.from("students").update({ voted: false }).neq("account", "__none__");
  await setPage("teacher");
}

function pollResultsHTML() {
  const poll = state.cache.poll;
  if (!poll) return "";
  const options = state.cache.pollOptions;
  const votes = state.cache.votes.filter(v => v.poll_id === poll.id);
  const total = votes.length || 1;

  return options.map((op,i)=>{
    const count = votes.filter(v => v.option_id === op.id).length;
    const p = Math.round(count / total * 100);
    return `
      <div class="result-row">
        <span>${String.fromCharCode(65+i)}. ${escapeHTML(op.option_text)}</span>
        <div class="bar"><span style="width:${p}%"></span></div>
        <span>${p}%（${count}人）</span>
      </div>
    `;
  }).join("");
}

function selectOption(optionId) {
  state.selectedOption = optionId;
  renderStudent();
}

async function submitVote() {
  const poll = state.cache.poll;
  if (!poll) return;
  if (!state.selectedOption) return alert("请先选择一个投票选项");

  const { error } = await db.from("votes").insert({
    poll_id: poll.id,
    option_id: state.selectedOption,
    account: state.currentUser.account
  });
  if (error) {
    alert(error.message.includes("duplicate") ? "你已经提交过投票" : error.message);
    return;
  }
  await db.from("students").update({ voted: true }).eq("account", state.currentUser.account);
  state.selectedOption = null;
  await setPage("student");
}

function showStudentResults() {
  const el = document.getElementById("voteResult");
  if (el) el.innerHTML = `<div style="margin-top:18px;">${pollResultsHTML()}</div>`;
}

function renderCourseDetail() {
  const classActive = state.cache.courseState?.class_active;
  app.innerHTML = `
    <section class="page-title">
      <div>
        <h1>课程详情</h1>
        <p>本页面展示《${COURSE.name}》的课堂互动信息</p>
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
          <div class="detail-item"><b>任课教师</b><span>${escapeHTML(courseTeacherName())}</span></div>
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
  const poll = state.cache.poll;
  const options = poll ? state.cache.pollOptions.map(o => o.option_text) : ["", ""];
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
  if (count >= 6) return alert("最多设置 6 个选项");
  box.insertAdjacentHTML("beforeend", optionInputHTML(count, ""));
}

function removeOptionInput() {
  const box = document.getElementById("optionEditor");
  const items = box.querySelectorAll(".option-input");
  if (items.length <= 2) return alert("至少保留 2 个选项");
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

async function publishPoll() {
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

  if (state.cache.poll) await clearPollSilent();

  const { data: poll, error } = await db
    .from("polls")
    .insert({ question, active: true })
    .select()
    .single();

  if (error) {
    alertBox.textContent = error.message;
    return;
  }

  const optionRows = options.map((option_text, i) => ({
    poll_id: poll.id,
    option_text,
    sort_order: i
  }));

  const { error: optionError } = await db.from("poll_options").insert(optionRows);
  if (optionError) {
    alertBox.textContent = optionError.message;
    return;
  }

  await db.from("students").update({ voted: false }).neq("account", "__none__");
  await setPage("teacher");
}

async function clearPollSilent() {
  if (!state.cache.poll) return;
  await db.from("votes").delete().eq("poll_id", state.cache.poll.id);
  await db.from("poll_options").delete().eq("poll_id", state.cache.poll.id);
  await db.from("polls").delete().eq("id", state.cache.poll.id);
}

function renderStudentManage() {
  const students = state.cache.students;
  const sample = `李静,2023123456,2023级新闻班\n李明轩,2023123457,2023级广告班\n陈雨桐,2023123458,2023级新闻班`;
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
          <p class="small">新添加学生默认密码为 123456。</p>
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
        <div><h3>当前课程名单</h3><p class="small">共 ${students.length} 人；删除学生表示中途退课，仅教师端可操作</p></div>
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
              <td>${escapeHTML(s.real_name)}</td>
              <td>${escapeHTML(s.account)}</td>
              <td>${escapeHTML(s.major_class || "")}</td>
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

function fillSample() {
  document.getElementById("batchText").value = `李静,2023123456,2023级新闻班\n李明轩,2023123457,2023级广告班\n陈雨桐,2023123458,2023级新闻班`;
}

async function addOneStudent() {
  const name = document.getElementById("oneName").value.trim();
  const account = document.getElementById("oneAccount").value.trim();
  const majorClass = document.getElementById("oneMajorClass").value.trim();
  const alertBox = document.getElementById("studentManageAlert");
  if (!name || !account || !majorClass) {
    alertBox.textContent = "请完整填写学生信息";
    return;
  }
  await upsertStudent({ real_name:name, account, major_class:majorClass });
  await setPage("studentManage");
}

async function batchImportStudents() {
  const text = document.getElementById("batchText").value.trim();
  if (!text) return alert("请先输入名单内容");
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let ok = 0;
  for (const line of lines) {
    const parts = line.split(/[,，\s]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      await upsertStudent({ real_name: parts[0], account: parts[1], major_class: parts.slice(2).join("") });
      ok++;
    }
  }
  alert(`已导入 ${ok} 条学生信息。新导入学生默认密码为 123456`);
  await setPage("studentManage");
}

async function upsertStudent(newStudent) {
  const { error } = await db.from("students").upsert({
    ...newStudent,
    signed: false,
    voted: false,
    called: false
  }, { onConflict: "account" });
  if (error) return alert(error.message);

  const { data: existing } = await db.from("users").select("*").eq("account", newStudent.account).maybeSingle();
  if (existing) {
    await db.from("users").update({
      real_name: newStudent.real_name,
      major_class: newStudent.major_class
    }).eq("account", newStudent.account);
  } else {
    await db.from("users").insert({
      role: "student",
      account: newStudent.account,
      real_name: newStudent.real_name,
      major_class: newStudent.major_class,
      password: "123456"
    });
  }
}

async function removeStudent(account) {
  const target = state.cache.students.find(s => s.account === account);
  if (!target) return;
  if (!confirm(`确认将 ${target.real_name} 从本课程名单中删除吗？该操作表示中途退课，仅教师端可执行。`)) return;
  const { error } = await db.from("students").delete().eq("account", account);
  if (error) return alert(error.message);
  await setPage("studentManage");
}

async function init() {
  loadSession();
  syncUserArea();
  showLoading();
  try {
    await fetchAllData();
    if (state.currentUser) {
      state.page = state.currentUser.role === "teacher" ? "teacher" : "student";
    } else {
      state.page = "login";
    }
    render();
  } catch (err) {
    showError(err);
  }
}

init();
