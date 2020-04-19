'use strict';

class Account {
    
    constructor(name, host, port, user, password, prefix, role, current = false) {
        this.name = name;
        this.host = host;
        this.port = port ? parseInt(port) : null;
        this.user = user;
        this.password = password;
        this.prefix = (typeof prefix === 'string') ? (prefix === 'true') : prefix;
        this.role = role;
        this.current = current;
        this.credentials = this.useCredentials;
    }

    get useCredentials() {
        return (!!this.user || (!!this.user && !!this.password));
    }
}

export default Account;