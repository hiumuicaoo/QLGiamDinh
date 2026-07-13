export interface Examiner {
  name: string;
  rank: string;
  role: string;
}

export interface Dossier {
  id: string;
  field: "DUONGVAN" | "TAILIEU" | "SUNGDAN";
  requestNo: string;
  requestOrg: string;
  requestOrgType: "Cơ quan Cảnh sát điều tra Công an tỉnh Khánh Hoà" | "Khác";
  requestOrgOther: string;
  caseNo: string;       // e.g. "12/GT-26"
  caseNoX: number;      // e.g. 12
  caseNoYY: string;     // e.g. "26"
  receiveDate: string;  // YYYY-MM-DD
  isReceiveDateOpen: boolean;
  summary: string;
  registerNo: string;   // e.g. "aGTmmyy/511CH"
  registerNoA: number;  // e.g. a
  decisionNo: string;
  startDate: string;    // YYYY-MM-DD
  isStartDateOpen: boolean;
  endDate: string;      // YYYY-MM-DD
  examiners: Examiner[];
  assistants: string[];
  leaderRank: string;
  leaderName: string;
  leaderRole: "Trưởng phòng" | "Phó Trưởng phòng";
  
  // Dashboard states
  statusGiao: "Đang giao" | "Đã giao";
  statusNoLuu: string;
  statusScan: "Rồi" | "Chưa";
  statusPhanMem: "Rồi" | "Chưa";
  statusSoHoa: "Rồi" | "Chưa";
  statusNopLuu: "Rồi" | "Chưa";
  createdAt: string;
}
