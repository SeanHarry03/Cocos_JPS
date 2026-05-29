import { Enum } from 'cc';
import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

export enum RedPointConst {
    /**主界面 */
    main = "Main",
    /**邮件 */
    mail = "Main.Mail",
    /**邮件-系统 */
    mailSystem = "Main.Mail.System",
    /**邮件-队伍*/
    mailTeam = "Main.Mail.Team",
    /**邮件-工会 */
    mailAlliance = "Main.Mail.Alliance",
    /**任务 */
    task = "Main.Task",
    /**工会 */
    alliance = "Main.Alliance"
}


const _redPointTreeObj: Record<string, number> = {};
const _indexToObj: Record<number, RedPointConst> = {};
let _idx = 0;
for (const key of Object.keys(RedPointConst)) {
    _redPointTreeObj[key] = _idx;
    _indexToObj[_idx] = (RedPointConst as any)[key];
    _idx++;
}

export const RedPointNameEnum = Enum(_redPointTreeObj);

export function RedPointNameEnumToStr(index: number) {
    return _indexToObj[index] ?? RedPointConst.main;
}