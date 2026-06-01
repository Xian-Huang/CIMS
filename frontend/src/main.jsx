import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Download, Filter, FileUp, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import "./styles.css";

const API_BASE = "http://127.0.0.1:8000/api";

const initialForm = {
  school: "primary",
  recordType: "in",
  itemId: "",
  quantity: "",
  unit: "kg",
  supplier: "",
  operator: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  remark: "",
};

const schoolLabels = { primary: "小学", middle: "中学" };

function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return query.toString();
}

function App() {
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ inQuantity: 0, outQuantity: 0, stock: 0, items: [] });
  const [form, setForm] = useState(initialForm);
  const [newItem, setNewItem] = useState({ name: "", unit: "kg", unitPrice: "" });
  const [editItem, setEditItem] = useState({ id: "", name: "", unit: "kg", unitPrice: "" });
  const [filters, setFilters] = useState({
    school: "",
    recordType: "",
    keyword: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const query = useMemo(() => buildQuery(filters), [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const suffix = query ? `?${query}` : "";
      const [recordsRes, summaryRes, itemsRes] = await Promise.all([
        fetch(`${API_BASE}/records/${suffix}`),
        fetch(`${API_BASE}/summary/${suffix}`),
        fetch(`${API_BASE}/items/`),
      ]);
      if (!recordsRes.ok || !summaryRes.ok || !itemsRes.ok) throw new Error("后端服务未响应");
      const recordsData = await recordsRes.json();
      const summaryData = await summaryRes.json();
      const itemsData = await itemsRes.json();
      setRecords(recordsData.results);
      setSummary(summaryData);
      setItems(itemsData.results);
      if (!form.itemId && itemsData.results.length) {
        const firstItem = itemsData.results[0];
        setForm((current) => ({
          ...current,
          itemId: String(firstItem.id),
          unit: firstItem.unit,
        }));
        setEditItem({
          id: String(firstItem.id),
          name: firstItem.name,
          unit: firstItem.unit,
          unitPrice: String(firstItem.unitPrice || ""),
        });
      }
      setMessage("");
    } catch (error) {
      setMessage(`读取失败：${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [query]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectItem(itemId) {
    const item = items.find((current) => String(current.id) === String(itemId));
    setForm((current) => ({ ...current, itemId, unit: item?.unit || current.unit }));
    if (item) {
      setEditItem({
        id: String(item.id),
        name: item.name,
        unit: item.unit,
        unitPrice: String(item.unitPrice || ""),
      });
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/records/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      setForm({ ...initialForm, school: form.school, recordType: form.recordType, itemId: form.itemId, unit: form.unit, occurredAt: form.occurredAt });
      setMessage("记录已保存");
      loadData();
    } catch (error) {
      setMessage(`保存失败：${error.message}`);
    }
  }

  async function addItem() {
    if (!newItem.name.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/items/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "新增物品失败");
      setNewItem({ name: "", unit: "kg", unitPrice: "" });
      setForm((current) => ({ ...current, itemId: String(data.id), unit: data.unit }));
      setMessage("物品已加入清单");
      loadData();
    } catch (error) {
      setMessage(`新增物品失败：${error.message}`);
    }
  }

  async function saveItem() {
    if (!editItem.id || !editItem.name.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/items/${editItem.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "修改物品失败");
      setForm((current) => ({ ...current, itemId: String(data.id), unit: data.unit }));
      setEditItem({
        id: String(data.id),
        name: data.name,
        unit: data.unit,
        unitPrice: String(data.unitPrice || ""),
      });
      setMessage("物品已修改");
      loadData();
    } catch (error) {
      setMessage(`修改物品失败：${error.message}`);
    }
  }

  async function deleteItem() {
    if (!editItem.id) return;
    try {
      const response = await fetch(`${API_BASE}/items/${editItem.id}/`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "删除物品失败");
      const remainingItems = items.filter((item) => String(item.id) !== String(editItem.id));
      const nextItem = remainingItems[0];
      setForm((current) => ({
        ...current,
        itemId: nextItem ? String(nextItem.id) : "",
        unit: nextItem ? nextItem.unit : "kg",
      }));
      setEditItem(
        nextItem
          ? {
              id: String(nextItem.id),
              name: nextItem.name,
              unit: nextItem.unit,
              unitPrice: String(nextItem.unitPrice || ""),
            }
          : { id: "", name: "", unit: "kg", unitPrice: "" }
      );
      setMessage("物品已删除");
      loadData();
    } catch (error) {
      setMessage(`删除物品失败：${error.message}`);
    }
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(`${API_BASE}/import/`, { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error((data.errors || [data.error]).join("；"));
      setMessage(`导入完成：新增 ${data.created} 条记录`);
      loadData();
    } catch (error) {
      setMessage(`导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  async function deleteRecord(id) {
    const response = await fetch(`${API_BASE}/records/${id}/`, { method: "DELETE" });
    if (response.ok) {
      setMessage("记录已删除");
      loadData();
    } else {
      setMessage("删除失败");
    }
  }

  function exportRecords(type) {
    const suffix = query ? `&${query}` : "";
    window.location.href = `${API_BASE}/export/?type=${type}${suffix}`;
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>食堂仓库管理系统</h1>
          <p>小学、中学食材与物资出入库台账</p>
        </div>
        <button className="ghost iconText" onClick={loadData} disabled={loading} title="刷新">
          <RefreshCw size={18} />
          刷新
        </button>
      </header>

      <section className="stats" aria-label="库存概览">
        <div>
          <span>现存量</span>
          <strong>{summary.stock.toFixed(2)}</strong>
        </div>
        <div>
          <span>入库数量</span>
          <strong>{summary.inQuantity.toFixed(2)}</strong>
        </div>
        <div>
          <span>出库数量</span>
          <strong>{summary.outQuantity.toFixed(2)}</strong>
        </div>
        <div>
          <span>物品种类</span>
          <strong>{summary.items.length}</strong>
        </div>
      </section>

      {message && <div className="notice">{message}</div>}

      <div className="workspace">
        <section className="panel formPanel">
          <div className="panelTitle">
            <Plus size={18} />
            <h2>新增出入库</h2>
          </div>
          <form onSubmit={handleSubmit} className="recordForm">
            <div className="segmented">
              <button type="button" className={form.school === "primary" ? "active" : ""} onClick={() => updateForm("school", "primary")}>
                小学
              </button>
              <button type="button" className={form.school === "middle" ? "active" : ""} onClick={() => updateForm("school", "middle")}>
                中学
              </button>
            </div>
            <div className="segmented">
              <button type="button" className={form.recordType === "in" ? "active in" : ""} onClick={() => updateForm("recordType", "in")}>
                入库
              </button>
              <button type="button" className={form.recordType === "out" ? "active out" : ""} onClick={() => updateForm("recordType", "out")}>
                出库
              </button>
            </div>

            <label>
              物品名称
              <select value={form.itemId} onChange={(e) => selectItem(e.target.value)} required>
                <option value="">请选择物品</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} / {item.unit} / {Number(item.unitPrice || 0).toFixed(2)}元
                  </option>
                ))}
              </select>
            </label>
            <div className="inlineItemForm">
              <input value={newItem.name} onChange={(e) => setNewItem((current) => ({ ...current, name: e.target.value }))} placeholder="新增物品名称" />
              <input value={newItem.unit} onChange={(e) => setNewItem((current) => ({ ...current, unit: e.target.value }))} placeholder="单位" />
              <input type="number" min="0" step="0.01" value={newItem.unitPrice} onChange={(e) => setNewItem((current) => ({ ...current, unitPrice: e.target.value }))} placeholder="单价" />
              <button className="ghost" type="button" title="新增物品" onClick={addItem}>
                <Plus size={16} />
              </button>
            </div>
            <div className="itemEditor">
              <input value={editItem.name} onChange={(e) => setEditItem((current) => ({ ...current, name: e.target.value }))} placeholder="修改物品名称" />
              <input value={editItem.unit} onChange={(e) => setEditItem((current) => ({ ...current, unit: e.target.value }))} placeholder="单位" />
              <input type="number" min="0" step="0.01" value={editItem.unitPrice} onChange={(e) => setEditItem((current) => ({ ...current, unitPrice: e.target.value }))} placeholder="单价" />
              <button className="ghost" type="button" title="保存物品修改" onClick={saveItem} disabled={!editItem.id}>
                <Save size={16} />
              </button>
              <button className="ghost dangerButton" type="button" title="删除物品" onClick={deleteItem} disabled={!editItem.id}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="twoCols">
              <label>
                日期
                <input type="date" value={form.occurredAt} onChange={(e) => updateForm("occurredAt", e.target.value)} required />
              </label>
            </div>
            <div className="twoCols">
              <label>
                数量
                <input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => updateForm("quantity", e.target.value)} required />
              </label>
              <label>
                单位
                <input value={form.unit} onChange={(e) => updateForm("unit", e.target.value)} required />
              </label>
            </div>
            <label>
              供应商/领用人
              <input value={form.supplier} onChange={(e) => updateForm("supplier", e.target.value)} />
            </label>
            <label>
              经办人
              <input value={form.operator} onChange={(e) => updateForm("operator", e.target.value)} />
            </label>
            <label>
              备注
              <textarea value={form.remark} onChange={(e) => updateForm("remark", e.target.value)} rows="3" />
            </label>
            <button className="primary iconText" type="submit">
              <Plus size={18} />
              保存记录
            </button>
          </form>
        </section>

        <section className="recordsArea">
          <div className="toolbar">
            <div className="panelTitle">
              <Filter size={18} />
              <h2>记录查询</h2>
            </div>
            <div className="actions">
              <button className="ghost" title="导出 CSV" onClick={() => exportRecords("csv")}>
                <Download size={18} />
                CSV
              </button>
              <button className="ghost" title="导出 Excel" onClick={() => exportRecords("xlsx")}>
                <Download size={18} />
                Excel
              </button>
              <label className="ghost importButton" title="导入 CSV 或 Excel">
                <FileUp size={18} />
                导入
                <input type="file" accept=".csv,.xlsx" onChange={importFile} />
              </label>
            </div>
          </div>

          <div className="filters">
            <select value={filters.school} onChange={(e) => updateFilter("school", e.target.value)}>
              <option value="">全部学校</option>
              <option value="primary">小学</option>
              <option value="middle">中学</option>
            </select>
            <select value={filters.recordType} onChange={(e) => updateFilter("recordType", e.target.value)}>
              <option value="">全部类型</option>
              <option value="in">入库</option>
              <option value="out">出库</option>
            </select>
            <input type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)} />
            <input type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)} />
            <div className="searchBox">
              <Search size={16} />
              <input value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)} placeholder="搜索物品/人员/供应商" />
            </div>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>学校</th>
                  <th>类型</th>
                  <th>物品</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>供应商/领用人</th>
                  <th>经办人</th>
                  <th>日期</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{schoolLabels[record.school]}</td>
                    <td><span className={`tag ${record.recordType}`}>{record.recordTypeLabel}</span></td>
                    <td>{record.itemName}</td>
                    <td>{Number(record.unitPrice || 0).toFixed(2)}</td>
                    <td>{record.quantity.toFixed(2)} {record.unit}</td>
                    <td>{record.supplier || "-"}</td>
                    <td>{record.operator || "-"}</td>
                    <td>{record.occurredAt}</td>
                    <td>
                      <button className="iconButton danger" title="删除" onClick={() => deleteRecord(record.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!records.length && (
                  <tr>
                    <td colSpan="9" className="empty">{loading ? "正在加载..." : "暂无记录"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
