# TODO

- [ ] Include custom resource to update slash commands on deploy
- [x] Add auto shutoff action onto CW alarms
- [ ] Refactor lambdas so that you only need one instead of one per server
- [ ] Add dashboard stack for creating a dashboard of all your servers' CW Alarms
- [ ] Add webhook to discord so the bot can announce server state changes.
  - When auto shutoff is initiated.
  - When the server transitions from its boot sequence to online.
  - Check out [event hooks in the container](https://github.com/lloesche/valheim-server-docker#notify-on-discord) for this.

Note that, additionally, there are many TODOs in the code itself.
