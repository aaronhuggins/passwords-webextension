<template>
    <div class="server-setup-wizard">
        <translate tag="h2" say="FirstRunConnectTitle"/>
        <translate say="FirstRunConnectText"/>
        <ul class="sever-setup-options">
            <translate tag="li" say="FirstRunConnectLink" v-if="platform !== 'chrome'"/>
            <translate tag="li" say="FirstRunConnectScan" v-if="platform !== 'chrome'"/>
            <translate tag="li" say="FirstRunConnectScanChrome" v-if="platform === 'chrome'"/>
            <translate tag="li" say="FirstRunConnectManual"/>
        </ul>
        <button-field value="FirstRunConnectScanButton" @click="scanQr"/>
    </div>
</template>

<script>
    import Translate from '@vue/Components/Translate';
    import ButtonField from '@vue/Components/Form/ButtonField';
    import MessageService from '@js/Services/MessageService';
    import ErrorManager from '@js/Manager/ErrorManager';
    import SystemService from '@js/Services/SystemService';

    export default {
        components: {ButtonField, Translate},

        data() {
            return {
                platform: SystemService.getBrowserPlatform()
            };
        },

        computed: {},

        methods: {
            scanQr() {
                MessageService.send({type: 'passlink.open', payload: {action: 'scan-qr'}})
                    .catch(ErrorManager.catch);
                window.close();
            }
        }
    };
</script>

<style lang="scss">
    .server-setup-wizard {
        h2 {
            text-align : center;
        }

        .sever-setup-options {
            padding-left : 1rem;

            li {
                margin-bottom : .25rem;
            }
        }

        button {
            background-color : var(--element-active-bg-color);
            color            : var(--element-active-fg-color);
            text-align       : center;
            position         : absolute;
            bottom           : .5rem;
            width            : calc(100% - 1rem);
            line-height      : 3rem;
            border-radius    : var(--button-border-radius);
            border           : none;
            cursor           : pointer;

            &:hover {
                background-color : var(--element-active-hover-bg-color);
                color            : var(--element-active-hover-fg-color);
            }
        }
    }
</style>