'use strict';

import Account from './webUI.account';

function webUIService($rootScope, $location, $window, rolesFactory) {
    'ngInject';

    let storage = $window.localStorage;
    let accounts = [];
    let current = null;

    let defaultHost = $location.host();
    let defaultPort = 18883;
    let defaultRole = rolesFactory.ROLE_ONE;

    function load() {
        accounts = storage.webUI ? JSON.parse(storage.webUI).map(createFromData) : [];
    }

    function sync() {
        storage.setItem('webUI', JSON.stringify(accounts));
    }

    function create() {
        let account = new Account();
        account.port = defaultPort;
        account.role = parseInt(rolesFactory.current.role || defaultRole);
        return account;
    }

    function createFromData(data) {
        return new Account(data.name, data.host, data.port, data.user, data.password, data.prefix, data.role, data.current);
    }

    function save(account) {
        if (!account.name) {
            account.name = account.host;
        }

        if (!accounts.find(a => a === account)) {
            accounts.push(account);
        }
        sync();
    }

    function getCurrent() {
        return accounts.find(a => a.current === true);
    }

    function setCurrent(account) {
        accounts.forEach(a => a.current = a === account);
        current = account;
        sync();
    }

    function remove(account) {
        let isCurrent = account === current;

        accounts.splice(accounts.indexOf(account), 1);
        sync();

        if (!isCurrent) {
            return;
        }

        if (accounts.length) {
            setCurrent(accounts[accounts.length - 1]);
        }

        if (current) {
            login(current);
        }
        else {
            location.reload();
        }
    }

    function login(account) {
        setCurrent(account);

        storage.setItem('host', account.host);
        storage.setItem('port', account.port);
        storage.setItem('prefix', account.prefix);

        storage.setItem('user',  (account.useCredentials ? account.user : ''));
        storage.setItem('password', (account.useCredentials && account.password ? account.password : ''));

        let loginData = {
            host: account.host,
            port: account.port,
            user: account.user,
            password: account.password,
            prefix: account.prefix
        };

        rolesFactory.setRole(account.role);
        $rootScope.requestConfig(loginData);

        location.reload();
    }

    function init() {
        load();

        if (!accounts.length) {
            let host = storage.host || defaultHost;
            let port = storage.port || defaultPort;
            let user = storage.user;
            let password = storage.password;
            let prefix = storage.prefix;
            let role = rolesFactory.current.role || defaultRole;

            let account = new Account('Default', host, port, user, password, prefix, role, true);
            save(account);
        }

        current = getCurrent();
    }

    init();

    return {
        accounts: accounts,
        current: current,
        create: create,
        save: save,
        remove: remove,
        getCurrent: getCurrent,
        setCurrent: setCurrent,
        login: login
    };
}

export default webUIService;

