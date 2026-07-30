import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload limit high enough for unlimited equipment database with photos
  app.use(express.json({ limit: "200mb" }));
  app.use(express.urlencoded({ limit: "200mb", extended: true }));

  const DB_FILE = path.join(process.cwd(), "db.json");

  // Default database state
  const getInitialData = () => ({
    apb_finanzas_password: "APB12345",
    apb_catalogos_password: "APB12345",
    apb_showroom_password: "medica123",
    apb_equipos: [],
    apb_showroom_equipos: [],
    apb_colaboradores: [
      "Ing. Carlos Mendoza",
      "Ing. Sofía Ruiz",
      "Tec. Alejandro Torres",
      "Ing. Mariana Gómez",
      "Por asignar"
    ],
    apb_recibidos: [
      "Diana Ruiz",
      "Ing. Carlos Mendoza",
      "Ing. Sofía Ruiz",
      "Tec. Alejandro Torres",
      "Ing. Mariana Gómez"
    ],
    updatedAt: Date.now()
  });

  const readData = () => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        const data = JSON.parse(content);
        // Automatic migration of old default password
        let migrated = false;
        if (data.apb_finanzas_password === "APB2026") {
          data.apb_finanzas_password = "APB12345";
          migrated = true;
        }
        if (data.apb_catalogos_password === "APB2026") {
          data.apb_catalogos_password = "APB12345";
          migrated = true;
        }
        if (data.apb_showroom_password === undefined) {
          data.apb_showroom_password = "medica123";
          migrated = true;
        }
        if (migrated) {
          fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
        return data;
      }
    } catch (e) {
      console.error("Error reading database file", e);
    }
    return getInitialData();
  };

  const writeData = (data: any) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file", e);
    }
  };

  // Ensure DB file exists
  if (!fs.existsSync(DB_FILE)) {
    writeData(getInitialData());
  }

  // API endpoints
  app.get("/api/data", (req, res) => {
    res.json(readData());
  });

  app.post("/api/data", (req, res) => {
    const data = readData();
    const updates = req.body;

    let changed = false;
    const allowedKeys = [
      "apb_finanzas_password",
      "apb_catalogos_password",
      "apb_showroom_password",
      "apb_equipos",
      "apb_showroom_equipos",
      "apb_colaboradores",
      "apb_recibidos",
      "apb_2workers_config"
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        data[key] = updates[key];
        changed = true;
      }
    }

    if (changed) {
      data.updatedAt = Date.now();
      writeData(data);
    }

    res.json({ success: true, data });
  });

  // --- 2WORKERS INTEGRATION ENGINE ---
  async function authenticate2Workers(apiKey: string, apiToken: string) {
    try {
      const res = await fetch("https://api.2workers.me/v2/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, apiToken })
      });
      const data = await res.json();
      const result = data.result || data;
      if (result && result.accessToken) {
        return { success: true, token: result.accessToken };
      }
      
      const getRes = await fetch(`https://api.2workers.me/v2/login/?apiKey=${encodeURIComponent(apiKey)}&apiToken=${encodeURIComponent(apiToken)}`);
      const getData = await getRes.json();
      const getResult = getData.result || getData;
      if (getResult && getResult.accessToken) {
        return { success: true, token: getResult.accessToken };
      }

      return { success: false, error: data.message || getResult.message || "Credenciales de 2Workers inválidas." };
    } catch (e: any) {
      return { success: false, error: "Error de conexión con 2Workers: " + (e.message || String(e)) };
    }
  }

  async function perform2WorkersSync(apiKey: string, apiToken: string, syncTarget: string = 'showroom') {
    const auth = await authenticate2Workers(apiKey, apiToken);
    if (!auth.success || !auth.token) {
      return { success: false, error: auth.error };
    }

    const token = auth.token;
    let page = 1;
    let totalPages = 1;
    const all2WEquipments: any[] = [];

    while (page <= totalPages) {
      try {
        const url = `https://api.2workers.me/v2/equipments/?page=${page}&pageSize=100&order=asc&paramFilter=%7B%7D`;
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) break;
        const data = await res.json();
        const result = data.result || data;
        const list = result.entityList || (Array.isArray(result) ? result : []);
        all2WEquipments.push(...list);

        const paged = result.pagedSearchReturnData;
        if (paged && paged.pageSize && paged.totalItems) {
          totalPages = Math.ceil(paged.totalItems / paged.pageSize);
        } else {
          break;
        }
        page++;
        if (page > 30) break;
      } catch (e) {
        console.error("Error fetching 2Workers equipments page " + page, e);
        break;
      }
    }

    // Also fetch tasks (planejamento)
    const all2WTasks: any[] = [];
    try {
      const startDate = "2020-01-01T00:00:00";
      const endDate = "2030-12-31T23:59:59";
      const filterJson = JSON.stringify({ startDate, endDate });
      const taskUrl = `https://api.2workers.me/v2/tasks/?page=1&pageSize=100&order=desc&paramFilter=${encodeURIComponent(filterJson)}`;
      const taskRes = await fetch(taskUrl, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        const taskResult = taskData.result || taskData;
        const taskList = taskResult.entityList || (Array.isArray(taskResult) ? taskResult : []);
        all2WTasks.push(...taskList);
      }
    } catch (e) {
      console.error("Error fetching 2Workers tasks:", e);
    }

    const currentDb = readData();
    const existingShowroomMap = new Map<string, any>();
    (currentDb.apb_showroom_equipos || []).forEach((item: any) => existingShowroomMap.set(String(item.id), item));

    const existingTallerMap = new Map<string, any>();
    (currentDb.apb_equipos || []).forEach((item: any) => existingTallerMap.set(String(item.id), item));

    let newItemsCount = 0;

    for (const eq of all2WEquipments) {
      const eqId = "2w_" + eq.id;
      const serial = eq.identifier || ("2W-" + eq.id);
      const photos = [eq.urlImage, ...(eq.uriAnexos || [])].filter(Boolean);

      let brand = "2Workers";
      if (Array.isArray(eq.equipmentSpecifications)) {
        const bSpec = eq.equipmentSpecifications.find((s: any) => s.name && s.name.toLowerCase().includes('marca'));
        if (bSpec && bSpec.specification) brand = bSpec.specification;
      }

      if (syncTarget === 'showroom' || syncTarget === 'both') {
        if (!existingShowroomMap.has(eqId)) {
          newItemsCount++;
          const showroomItem = {
            id: eqId,
            nombre: eq.name || `Equipo 2Workers #${eq.id}`,
            modelo: eq.identifier || eq.description || "2Workers",
            numeroSerie: serial,
            marca: brand,
            precio: 0,
            estado: eq.active !== false ? 'available' : 'borrowed',
            fotos: photos.length > 0 ? photos : [],
            especificaciones: eq.description || "Importado desde 2Workers API",
            notas: `Registrado en 2Workers ID: ${eq.id} | Fecha: ${eq.creationDate || ''}`,
            fechaIngreso: eq.creationDate ? eq.creationDate.split('T')[0] : new Date().toISOString().split('T')[0]
          };
          existingShowroomMap.set(eqId, showroomItem);
        } else {
          const existing = existingShowroomMap.get(eqId);
          existing.nombre = eq.name || existing.nombre;
          existing.modelo = eq.identifier || eq.description || existing.modelo;
          if (photos.length > 0) existing.fotos = Array.from(new Set([...existing.fotos, ...photos]));
          existingShowroomMap.set(eqId, existing);
        }
      }

      if (syncTarget === 'taller' || syncTarget === 'both') {
        const tallerId = "2w_taller_" + eq.id;
        if (!existingTallerMap.has(tallerId)) {
          newItemsCount++;
          const tallerItem = {
            id: tallerId,
            folio: "2W-" + eq.id,
            equipo: eq.name || `Equipo 2Workers #${eq.id}`,
            marca: brand,
            modelo: eq.identifier || eq.description || "2Workers",
            numeroSerie: serial,
            clienteNombre: "Cliente 2Workers",
            clienteTelefono: "",
            fallasReportadas: eq.description || "Registrado en 2Workers (Planejamento)",
            accesorios: "N/A",
            colaboradorAsignado: "Por asignar",
            recibidoPor: "2Workers API",
            costoEstimado: 0,
            anticipo: 0,
            estado: "En Diagnóstico",
            prioridad: "Media",
            fechaIngreso: eq.creationDate ? eq.creationDate.split('T')[0] : new Date().toISOString().split('T')[0],
            fotosAntes: photos.length > 0 ? photos : [],
            fotosDespues: []
          };
          existingTallerMap.set(tallerId, tallerItem);
        }
      }
    }

    for (const t of all2WTasks) {
      if (t.taskId) {
        const taskIdStr = "2w_task_" + t.taskId;
        if (syncTarget === 'taller' || syncTarget === 'both') {
          if (!existingTallerMap.has(taskIdStr)) {
            newItemsCount++;
            const taskTallerItem = {
              id: taskIdStr,
              folio: "2WT-" + t.taskId,
              equipo: t.ticketTitle || t.orientation || `Tarea/Equipo #${t.taskId}`,
              marca: "2Workers",
              modelo: "Planejamento 2W",
              numeroSerie: "TASK-" + t.taskId,
              clienteNombre: t.customerDescription || "Cliente 2Workers",
              clienteTelefono: "",
              fallasReportadas: t.orientation || t.report || "Planejamento registrado en 2Workers",
              accesorios: "N/A",
              colaboradorAsignado: "Por asignar",
              recibidoPor: "2Workers API",
              costoEstimado: 0,
              anticipo: 0,
              estado: t.finished ? "Entregado" : "En Servicio",
              prioridad: t.priority == 3 ? "Alta" : "Media",
              fechaIngreso: t.taskDate ? t.taskDate.split('T')[0] : new Date().toISOString().split('T')[0],
              fotosAntes: [],
              fotosDespues: []
            };
            existingTallerMap.set(taskIdStr, taskTallerItem);
          }
        }
      }
    }

    currentDb.apb_showroom_equipos = Array.from(existingShowroomMap.values());
    currentDb.apb_equipos = Array.from(existingTallerMap.values());
    currentDb.apb_2workers_config = {
      apiKey,
      apiToken,
      syncTarget,
      lastSyncTime: Date.now(),
      lastSyncStatus: 'success',
      syncedCount: all2WEquipments.length + all2WTasks.length
    };
    currentDb.updatedAt = Date.now();
    writeData(currentDb);

    return {
      success: true,
      syncedCount: all2WEquipments.length + all2WTasks.length,
      newCount: newItemsCount,
      totalEquipmentsInDb: currentDb.apb_showroom_equipos.length
    };
  }

  app.get("/api/2workers/config", (req, res) => {
    const data = readData();
    res.json({ config: data.apb_2workers_config || {} });
  });

  app.post("/api/2workers/config", (req, res) => {
    const data = readData();
    data.apb_2workers_config = {
      ...(data.apb_2workers_config || {}),
      ...req.body
    };
    writeData(data);
    res.json({ success: true, config: data.apb_2workers_config });
  });

  app.post("/api/2workers/test", async (req, res) => {
    const { apiKey, apiToken } = req.body;
    if (!apiKey || !apiToken) {
      return res.status(400).json({ success: false, error: "API Key y API Token son requeridos." });
    }
    const result = await authenticate2Workers(apiKey, apiToken);
    res.json(result);
  });

  app.post("/api/2workers/sync", async (req, res) => {
    const data = readData();
    const config = data.apb_2workers_config || {};
    const apiKey = req.body.apiKey || config.apiKey;
    const apiToken = req.body.apiToken || config.apiToken;
    const syncTarget = req.body.syncTarget || config.syncTarget || 'showroom';

    if (!apiKey || !apiToken) {
      return res.status(400).json({ success: false, error: "Faltan credenciales de 2Workers (API Key / API Token)." });
    }

    const result = await perform2WorkersSync(apiKey, apiToken, syncTarget);
    res.json(result);
  });

  app.post("/api/2workers/webhook", (req, res) => {
    try {
      const body = req.body;
      const result = body.result || body;
      const entities = result.Entities || [];
      const currentDb = readData();
      let added = 0;

      for (const ent of entities) {
        if (ent.id || ent.taskId) {
          const id = ent.id ? ("2w_" + ent.id) : ("2w_task_" + ent.taskId);
          const name = ent.name || ent.ticketTitle || ent.orientation || "Equipo 2Workers Webhook";

          // Agregar equipo recibido desde 2Workers al taller APB
          const existingEquipos = currentDb.apb_equipos || [];

          if (!existingEquipos.some((e: any) => e.id === id)) {
            const nuevoEquipo = {
              id,
              nombreEquipo:
                ent.ticketTitle ||
                ent.name ||
                ent.orientation ||
                "Equipo 2Workers",
              numeroSerie:
                ent.externalId ||
                ent.identifier ||
                id,
              fechaLlegada:
                ent.creationDate
                  ? ent.creationDate.split("T")[0]
                  : new Date().toISOString().split("T")[0],
              fechaInicioRevision: null,
              fechaTermino: null,
              estado: "recepcion",
              ubicacion: "planta_baja",
              falla:
                ent.report ||
                ent.orientation ||
                "Registrado desde 2Workers",
              accesorios: "",
              colaborador: "",
              recibidoPor: "2Workers",
              hospital:
                ent.customerDescription ||
                "",
              observaciones:
                "Equipo recibido automáticamente desde Webhook 2Workers",
              costoServicio: 0,
              cobrado: false,
              marca: "2Workers"
            };

            currentDb.apb_equipos.unshift(nuevoEquipo);
            added++;
          }

          // Agregar a Showroom
          const existingShowroom = currentDb.apb_showroom_equipos || [];
          if (!existingShowroom.some((e: any) => e.id === id)) {
            existingShowroom.unshift({
              id,
              nombre: name,
              modelo: ent.identifier || ent.description || "2Workers",
              numeroSerie: ent.externalId || ent.identifier || id,
              marca: "2Workers",
              precio: 0,
              estado: 'available',
              fotos: ent.urlImage ? [ent.urlImage] : [],
              especificaciones: ent.description || "Recibido vía Webhook 2Workers",
              notas: `Webhook 2Workers ID: ${ent.id || ent.taskId}`,
              fechaIngreso: new Date().toISOString().split('T')[0]
            });
            currentDb.apb_showroom_equipos = existingShowroom;
          }
        }
      }

      if (added > 0) {
        currentDb.updatedAt = Date.now();
        writeData(currentDb);
      }

      res.json({ success: true, processed: added });
    } catch (e: any) {
      console.error("Error processing 2Workers webhook:", e);
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Background auto-sync interval (Runs every 3 minutes if credentials exist)
  setInterval(async () => {
    try {
      const db = readData();
      const cfg = db.apb_2workers_config;
      if (cfg && cfg.apiKey && cfg.apiToken && cfg.autoSync !== false) {
        console.log("Ejecutando sincronización automática programada con 2Workers...");
        await perform2WorkersSync(cfg.apiKey, cfg.apiToken, cfg.syncTarget || 'showroom');
      }
    } catch (e) {
      console.error("Error en auto-sincronización de 2Workers:", e);
    }
  }, 3 * 60 * 1000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();