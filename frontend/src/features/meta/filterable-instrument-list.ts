import type { InstrumentGroup } from '../../lib/api/types';

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase();
}

const PINYIN_TOKEN_MAP: Record<string, string[]> = {
  '贵州茅台': ['guizhoumaotai', 'gzmt', 'maotai', 'mt'],
  茅台: ['maotai', 'mt'],
  '五粮液': ['wuliangye', 'wly'],
  '伊利股份': ['yiligufen', 'ylgf', 'yili', 'yl'],
  伊利: ['yili', 'yl'],
  '泸州老窖': ['luzhoulaojiao', 'lzlj', 'laojiao', 'lj'],
  老窖: ['laojiao', 'lj'],
  '牧原股份': ['muyuangufen', 'mygf', 'muyuan', 'my'],
  牧原: ['muyuan', 'my'],
  '温氏股份': ['wenshigufen', 'wsgf', 'wenshi', 'ws'],
  温氏: ['wenshi', 'ws'],
  '恒瑞医药': ['hengruiyiyao', 'hryy', 'hengrui', 'hr'],
  恒瑞: ['hengrui', 'hr'],
  '迈瑞医疗': ['mairuiyiliao', 'mryl', 'mairui', 'mr'],
  迈瑞: ['mairui', 'mr'],
  '片仔癀': ['pianzaihuang', 'pzh'],
  '云南白药': ['yunnanbaiyao', 'ynby', 'baiyao', 'by'],
  白药: ['baiyao', 'by'],
  '药明康德': ['yaomingkangde', 'ymkd', 'yaoming', 'ym'],
  药明: ['yaoming', 'ym'],
  '智飞生物': ['zhifeishengwu', 'zfsw', 'zhifei', 'zf'],
  智飞: ['zhifei', 'zf'],
  '宁德时代': ['ningdeshidai', 'ndsd', 'ningde', 'nd'],
  宁王: ['ningwang', 'nw'],
  '比亚迪': ['biyadi', 'byd'],
  '隆基绿能': ['longjilvneng', 'ljln', 'longji', 'lj'],
  隆基: ['longji', 'lj'],
  '阳光电源': ['yangguangdianyuan', 'ygdy', 'yangguang', 'yg'],
  '晶科能源': ['jingkenengyuan', 'jkny', 'jingke', 'jk'],
  晶科: ['jingke', 'jk'],
  '通威股份': ['tongweigufen', 'twgf', 'tongwei', 'tw'],
  通威: ['tongwei', 'tw'],
  '韦尔股份': ['weiergufen', 'wegf', 'weier', 'we'],
  韦尔: ['weier', 'we'],
  '北方华创': ['beifanghuachuang', 'bfhc', 'beifang', 'bf'],
  '北京君正': ['beijingjunzheng', 'bjjz', 'junzheng', 'jz'],
  君正: ['junzheng', 'jz'],
  '澜起科技': ['lanqikeji', 'lqkj', 'lanqi', 'lq'],
  澜起: ['lanqi', 'lq'],
  '中芯国际': ['zhongxinguoji', 'zxgj', 'zhongxin', 'zx'],
  '长电科技': ['changdiankeji', 'cdkj', 'changdian', 'cd'],
  长电: ['changdian', 'cd'],
  '金山办公': ['jinshanbangong', 'jsbg', 'jinshan', 'js'],
  '科大讯飞': ['kedaxunfei', 'kdxf', 'xunfei', 'xf'],
  讯飞: ['xunfei', 'xf'],
  '恒生电子': ['hengshengdianzi', 'hsdz', 'hengsheng', 'hs'],
  '同花顺': ['tonghuashun', 'ths'],
  '用友网络': ['yongyouwangluo', 'yywl', 'yongyou', 'yy'],
  用友: ['yongyou', 'yy'],
  深信服: ['shenxinfu', 'sxf'],
  '立讯精密': ['lixunjingmi', 'lxjm', 'lixun', 'lx'],
  立讯: ['lixun', 'lx'],
  '中兴通讯': ['zhongxingtongxun', 'zxtx', 'zhongxing', 'zx'],
  中兴: ['zhongxing', 'zx'],
  '中际旭创': ['zhongjixuchuang', 'zjxc', 'zhongji', 'zj'],
  '卓胜微': ['zhuoshengwei', 'zsw'],
  '歌尔股份': ['geergufen', 'gegf', 'geer', 'ge'],
  歌尔: ['geer', 'ge'],
  '鹏鼎控股': ['pengdingkonggu', 'pdkg', 'pengding', 'pd'],
  鹏鼎: ['pengding', 'pd'],
  '招商银行': ['zhaoshangyinhang', 'zsyh', 'zhaoshang', 'zs'],
  招行: ['zhaohang', 'zh'],
  '中国平安': ['zhongguopingan', 'zgpa', 'pingan', 'pa'],
  平安: ['pingan', 'pa'],
  '中信证券': ['zhongxinzhengquan', 'zxzq', 'zhongxin', 'zx'],
  '华泰证券': ['huataizhengquan', 'htzq', 'huatai', 'ht'],
  '兴业银行': ['xingyeyinhang', 'xyyh', 'xingye', 'xy'],
  '工商银行': ['gongshangyinhang', 'gsyh', 'gonghang', 'gh'],
  工行: ['gonghang', 'gh'],
  '紫金矿业': ['zijinkuangye', 'zjky', 'zijin', 'zj'],
  '中国神华': ['zhongguoshenhua', 'zgsh', 'shenhua', 'sh'],
  神华: ['shenhua', 'sh'],
  '中国石化': ['zhongguoshihua', 'zgsh', 'shihua'],
  中石化: ['zhongshihua', 'zsh'],
  '中国海油': ['zhongguohaiyou', 'zghy', 'haiyou', 'hy'],
  海油: ['haiyou', 'hy'],
  '北方稀土': ['beifangxitu', 'bfxt', 'xitu', 'xt'],
  稀土: ['xitu', 'xt'],
  '云铝股份': ['yunlvgufen', 'ylgf', 'yunlv', 'yl'],
  云铝: ['yunlv', 'yl'],
  '中国建筑': ['zhongguojianzhu', 'zgjz', 'zhongjian', 'zj'],
  中建: ['zhongjian', 'zj'],
  '长江电力': ['changjiangdianli', 'cjdl', 'changjiang', 'cj'],
  '特变电工': ['tebiandiangong', 'tbdg', 'tebian', 'tb'],
  特变: ['tebian', 'tb'],
  '中国中铁': ['zhongguozhongtie', 'zgzt', 'zhongtie', 'zt'],
  中铁: ['zhongtie', 'zt'],
  '中国移动': ['zhongguoyidong', 'zgyd', 'yidong', 'yd'],
  移动: ['yidong', 'yd'],
  '招商蛇口': ['zhaoshangshekou', 'zssk', 'shekou', 'sk'],
  蛇口: ['shekou', 'sk'],
  '中航沈飞': ['zhonghangshenfei', 'zhsf', 'shenfei', 'sf'],
  沈飞: ['shenfei', 'sf'],
  '航发动力': ['hangfadongli', 'hfdl', 'hangfa', 'hf'],
  航发: ['hangfa', 'hf'],
  '中国国航': ['zhongguoguohang', 'zggh', 'guohang', 'gh'],
  国航: ['guohang', 'gh'],
  '春秋航空': ['chunqiuhangkong', 'cqhk', 'chunqiu', 'cq'],
  春秋: ['chunqiu', 'cq'],
  '中航西飞': ['zhonghangxifei', 'zhxf', 'xifei', 'xf'],
  西飞: ['xifei', 'xf'],
};

function buildSearchTokens(field: string) {
  const normalized = normalizeKeyword(field);
  const mapped = PINYIN_TOKEN_MAP[field] ?? [];
  return [normalized, ...mapped.map((token) => normalizeKeyword(token))];
}

export function filterInstrumentGroups(groups: InstrumentGroup[], keyword: string) {
  const normalizedKeyword = normalizeKeyword(keyword);

  if (!normalizedKeyword) {
    return groups;
  }

  return groups
    .map((group) => ({
      ...group,
      instruments: group.instruments.filter((instrument) =>
        [
          instrument.symbol,
          instrument.code,
          instrument.name,
          instrument.full_name,
          ...(instrument.aliases ?? []),
        ].some((field) => buildSearchTokens(field).some((token) => token.includes(normalizedKeyword)))
      ),
    }))
    .filter((group) => group.instruments.length > 0);
}
