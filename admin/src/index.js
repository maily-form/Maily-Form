import axios from 'axios';
import Vue from 'vue';
import VueRouter from 'vue-router';

import app from './app.vue';
import loginView from './login.vue';

// Styles
import './styles.scss';

Vue.use(VueRouter);

const router = new VueRouter({
    routes: [
        {
            path: '*',
            redirect: '/sent',
            component: app
        },
        {
            name: 'login',
            path: '/login',
            component: loginView
        },
        {
            name: 'submissions',
            path: '/:selector',
            component: app
        },
        {
            name: 'modal',
            path: '/:selector/:sid',
            component: app
        }
    ]
});

const vueApp = new Vue({
    router: router,
    el: '#app',
    data: {
        loggedIn: false,
        info: {
            title: "Administration"
        },
        submissions: []
    },
    methods: {
        login: login,
        logout: logout,
        deleteSubmissions: deleteSubmissions,
        deleteSubmission: deleteSubmission,
        archiveSubmissions: archiveSubmissions,
        archiveSubmission: archiveSubmission,
        unarchiveSubmission: unarchiveSubmission,
        respond: respond
    },
    watch: {
        '$route'(to, from) {
            if (this.loggedIn && from.params.selector !== to.params.selector) {
                getSubmissions(to.params.selector);
            } else if (!this.loggedIn && to.path !== "/login") {
                router.replace({path: '/login'});
            }
        }
    },
    mounted() {
        checkLogin();
    }
});

function checkLogin() {
    let token = findToken();
    if (token === null) {
        router.replace({path: '/login'});
    } else {
        axios.get(`/api/auth`, {
            headers: {
                "Authorization": "Basic " + token
            }
        }).
            then(() => {
                login();
                getSubmissions(router.currentRoute.params.selector);
            }).
            catch(() => {
                router.replace({path: '/login'});
            });
    }
}

function findToken() {
    let token = null;
    if (window.sessionStorage.getItem("authToken") != null) {
        token = window.sessionStorage.getItem("authToken");
    } else {
        token = window.localStorage.getItem("authToken");
    }
    return token;
}

function login() {
    axios.defaults.headers.common = {
        "Authorization": "Basic " + findToken()
    };
    vueApp.loggedIn = true;
    getInfo();
}

function logout() {
    window.sessionStorage.removeItem("authToken");
    window.localStorage.removeItem("authToken");
    axios.defaults.headers.common = {
        "Authorization": ""
    };
    vueApp.loggedIn = false;
    router.replace({path: '/login'});
}

function getInfo() {
    axios.get(`/api/info`).
        then(response => {
            vueApp.info = response.data.result;
            document.title = vueApp.info.title;
        })
}

function getSubmissions(selector) {
    if(selector === null) selector = router.currentRoute.params.selector;
    axios.get(`/api/get/selector/${selector}`).
    then(response => (vueApp.submissions = response.data.result.submissions))
}

function deleteSubmissions(selector) {
    axios.post(`/api/delete/selector/${selector}`).
    then(() => getSubmissions(router.currentRoute.params.selector))
}

function deleteSubmission(id) {
    axios.post(`/api/delete/id/${id}`).
        then(() => getSubmissions(router.currentRoute.params.selector))
}

function archiveSubmissions(selector) {
    axios.post(`/api/archive/selector/${selector}`).
    then(() => getSubmissions(router.currentRoute.params.selector))
}

function archiveSubmission(id) {
    axios.post(`/api/archive/id/${id}`).
        then(() => getSubmissions(router.currentRoute.params.selector))
}

function unarchiveSubmission(id) {
    axios.post(`/api/unarchive/id/${id}`).
        then(() => getSubmissions(router.currentRoute.params.selector))
}

function respond(id, text) {
    axios.post(`/api/respond/id/${id}`, {text: text}).
        then(() => getSubmissions(router.currentRoute.params.selector))
}
