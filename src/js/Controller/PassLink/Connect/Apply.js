import AbstractController from '@js/Controller/AbstractController';
import TabManager from '@js/Manager/TabManager';
import SystemService from '@js/Services/SystemService';
import LocalisationService from '@js/Services/LocalisationService';
import HttpError from 'passwords-client/src/Exception/Http/HttpError';
import NetworkError from 'passwords-client/src/Exception/NetworkError';
import ServerValidation from '@js/Validation/Server';
import ServerRepository from '@js/Repositories/ServerRepository';
import ServerManager from '@js/Manager/ServerManager';
import ErrorManager from '@js/Manager/ErrorManager';

export default class Analyze extends AbstractController {

    /**
     *
     * @param {Message} message
     * @param {Message} reply
     */
    async execute(message, reply) {
        if(!TabManager.has('passlink.action.connect')) {
            reply.setPayload({success: false, message: 'PasslinkNoActiveAction'});
        }

        /** @type Connect **/
        let action = TabManager.get('passlink.action.connect');
        action.setClientLabel(await this._getClientLabel());

        let createServer = !TabManager.has('passlink.connect' + action.getParameter('id'));
        TabManager.set('passlink.connect' + action.getParameter('id'), true);

        try {
            let login = await action.apply(),
                label = await this._getServerName(login, action);

            if(createServer) await this._createServer(login, action, label);

            reply.setPayload({success: true, message: label});
        } catch(e) {
            reply.setPayload({success: false, message: this._getErrorMessage(e)});
        }

        TabManager.remove('passlink.action.connect');
    }

    /**
     *
     * @param {Object} login
     * @param {Connect} action
     * @param {String} label
     * @return {Promise<void>}
     */
    async _createServer(login, action, label) {
        let data       = {
                label,
                baseUrl: action.getParameters().baseUrl,
                user   : login.login,
                token  : login.token
            },
            validation = new ServerValidation(),
            result     = await validation.validate(data);

        if(!result.ok) throw new Error(result.message);

        let server = result.server;
        server.setEnabled(true);
        await ServerRepository.create(server);
        ServerManager.addServer(server)
            .catch(ErrorManager.catch);
    }


    /**
     *
     * @param {Object} login
     * @param {Connect} action
     * @return {Promise<String>}
     */
    async _getServerName(login, action) {
        let theme = await action.getTheme();
        if(theme.hasOwnProperty('label')) {
            return `${theme.label} - ${login.login}`;
        }
        let host = new URL(action.getParameter('baseUrl')).host;
        return `${login.login}@${host}`;
    }

    /**
     *
     * @return {Promise<String>}
     * @private
     */
    async _getClientLabel() {
        let bwInfo = await SystemService.getBrowserInfo(),
            osInfo = await SystemService.getBrowserApi().runtime.getPlatformInfo(),
            os     = osInfo.os ? `${osInfo.os[0].toUpperCase()}${osInfo.os.substr(1)}`:'';

        return LocalisationService.translate('UserAgent', [bwInfo.name, os]);
    }

    /**
     *
     * @param {Error} error
     * @return {string|*}
     * @private
     */
    _getErrorMessage(error) {
        if(error instanceof HttpError && (error.status === 404 || error.status === 424)) {
            return error.status === 404 ? 'PasslinkConnectNotFound':'PasslinkConnectRejected';
        } else if(error instanceof NetworkError) {
            return 'PasslinkConnectNetworkError';
        }

        return error.message;
    }
}