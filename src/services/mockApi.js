const STORAGE_KEY = 'ordenes_mecanicas_mock_state_v1';

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const deepClone = (value) => safeParse(JSON.stringify(value), value);

const normalizeText = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;

const seedState = () => ({
  meta: { version: 1, createdAt: now() },
  counters: {
    user: 4,
    client: 2,
    product: 4,
    quote: 2,
    order: 3,
  },
  users: [
    { id: 'u-admin', nombre: 'Admin Demo', correo: 'admin@gmail.com', contrasena: 'admin', rol: 'Administrador', estado: 'Activo', usuario: 'admin' },
    { id: 'u-mostrador', nombre: 'Mostrador Demo', correo: 'mostrador@demo.com', contrasena: 'mostrador123', rol: 'Mostrador', estado: 'Activo', usuario: 'mostrador' },
    { id: 'u-tecnico', nombre: 'Tecnico Demo', correo: 'tecnico@demo.com', contrasena: 'tecnico123', rol: 'Técnico', estado: 'Activo', usuario: 'tecnico' },
    { id: 'u-cotizador', nombre: 'Cotizador Demo', correo: 'cotizador@demo.com', contrasena: 'cotizador123', rol: 'Cotizador', estado: 'Activo', usuario: 'cotizador' },
  ],
  clients: [
    { id: 'c-1', nombre: 'Cliente Prueba', correo: 'cliente@demo.com', telefono: '5551234567', usuario: 'cliente.demo', contrasena: 'cliente123', activo: true },
  ],
  products: [
    { id: 'p-1', nombre: 'Diagnóstico básico', descripcion: 'Revisión inicial y detección de fallas', unidad: 'SERVICIO', precioBase: 250 },
    { id: 'p-2', nombre: 'Limpieza interna', descripcion: 'Mantenimiento preventivo', unidad: 'SERVICIO', precioBase: 180 },
    { id: 'p-3', nombre: 'Cambio de batería', descripcion: 'Instalación y prueba', unidad: 'PZA', precioBase: 890 },
    { id: 'p-4', nombre: 'Cable de carga', descripcion: 'Accesorio de prueba', unidad: 'PZA', precioBase: 150 },
  ],
  quotes: [
    {
      id: 'q-1',
      numeroCotizacion: 'COT-0001',
      fecha: today(),
      vigencia: 7,
      empresa: 'Mecanica',
      cliente: 'Cliente Prueba',
      correo: 'cliente@demo.com',
      telefono: '5551234567',
      direccion: 'Sucursal principal',
      direccionCliente: 'Sucursal principal',
      razonSocial: 'Mecanica Demo SA de CV',
      rfc: 'MEC010101AA1',
      repse: 'REPSE-001',
      status: 'Aprobado',
      emisor: 'sieeg',
      observaciones: 'Cotización inicial demo.',
      observacionesExtra: '',
      partidas: [
        { cantidad: 1, descripcion: 'Diagnóstico básico', unidad: 'SERVICIO', precioUnitario: 250, importe: 250, observaciones: '' },
        { cantidad: 1, descripcion: 'Limpieza interna', unidad: 'SERVICIO', precioUnitario: 180, importe: 180, observaciones: '' },
      ],
      total: 430,
      otro: '',
      pruebaRendimiento: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'q-2',
      numeroCotizacion: 'COT-0002',
      fecha: today(),
      vigencia: 5,
      empresa: 'Cliente Independiente',
      cliente: 'María López',
      correo: 'maria@demo.com',
      telefono: '5550002222',
      direccion: 'Cliente externo',
      direccionCliente: 'Cliente externo',
      razonSocial: 'María López',
      rfc: 'XAXX010101000',
      repse: '',
      status: 'Borrador',
      emisor: 'sinar',
      observaciones: 'Ejemplo de cotización para persona física.',
      observacionesExtra: '',
      partidas: [
        { cantidad: 1, descripcion: 'Cambio de batería', unidad: 'PZA', precioUnitario: 890, importe: 890, observaciones: '' },
      ],
      total: 890,
      otro: '',
      pruebaRendimiento: false,
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  orders: [
    {
      id: 'o-1',
      folio: 'S260501001',
      fecha: today(),
      clientName: 'Cliente Prueba',
      nombre: 'Cliente Prueba',
      telefono: '5551234567',
      correo: 'cliente@demo.com',
      tipo: 'Laptop',
      marca: 'Lenovo',
      modelo: 'ThinkPad T480',
      serie: 'LEN-12345',
      accesorios: ['Cargador'],
      otrosAccesorios: '',
      seguridad: '1234',
      patron: '[]',
      description: 'No enciende correctamente.',
      observaciones: 'Caso demo',
      firma: null,
      status: 'revision',
      tecnico: 'Tecnico Demo',
      technicianId: 'u-tecnico',
      trabajos: [{ descripcion: 'Diagnóstico inicial', costo: 250 }],
      diagnostico: 'Pendiente de revisión física.',
      resumen: { total: 250 },
      imagenes: [],
      presupuestoCliente: null,
      presupuestoAdmin: null,
      estadoPresupuesto: 'sin_presupuesto',
      clienteId: 'c-1',
      tipoOrden: 'cliente',
      foraneo: false,
      external: false,
      deleted: false,
      createdAt: now(),
      updatedAt: now(),
      history: [{ status: 'revision', date: now() }],
    },
    {
      id: 'o-2',
      folio: 'S260501002',
      fecha: today(),
      clientName: 'Servicio Externo Demo',
      nombre: 'Servicio Externo Demo',
      telefono: '5550003333',
      correo: 'externo@demo.com',
      tipo: 'Impresora',
      marca: 'HP',
      modelo: 'LaserJet',
      serie: 'EXT-777',
      accesorios: [],
      otrosAccesorios: '',
      seguridad: '0000',
      patron: '[]',
      description: 'Mantenimiento a equipo externo.',
      observaciones: 'Servicio foráneo',
      firma: null,
      status: 'pendiente',
      tecnico: 'Tecnico Demo',
      technicianId: 'u-tecnico',
      trabajos: [],
      diagnostico: '',
      resumen: { total: 0 },
      imagenes: [],
      presupuestoCliente: null,
      presupuestoAdmin: null,
      estadoPresupuesto: 'sin_presupuesto',
      clienteId: null,
      tipoOrden: 'foraneo',
      foraneo: true,
      external: true,
      deleted: false,
      createdAt: now(),
      updatedAt: now(),
      history: [{ status: 'pendiente', date: now() }],
    },
    {
      id: 'o-3',
      folio: 'S260501003',
      fecha: today(),
      clientName: 'Orden eliminada demo',
      nombre: 'Orden eliminada demo',
      telefono: '5550004444',
      correo: 'demo@demo.com',
      tipo: 'Celular',
      marca: 'Samsung',
      modelo: 'A12',
      serie: 'DEL-123',
      accesorios: [],
      otrosAccesorios: '',
      seguridad: '',
      patron: '[]',
      description: 'Orden de ejemplo eliminada.',
      observaciones: '',
      firma: null,
      status: 'cancelada',
      tecnico: 'Tecnico Demo',
      technicianId: 'u-tecnico',
      trabajos: [],
      diagnostico: '',
      resumen: { total: 0 },
      imagenes: [],
      presupuestoCliente: null,
      presupuestoAdmin: null,
      estadoPresupuesto: 'sin_presupuesto',
      clienteId: null,
      tipoOrden: 'normal',
      foraneo: false,
      external: false,
      deleted: true,
      deleteReason: 'Cliente canceló',
      deletedAt: now(),
      deletedBy: 'admin',
      createdAt: now(),
      updatedAt: now(),
      history: [{ status: 'cancelada', date: now() }],
    },
  ],
});

const getSeedAdminUser = () => seedState().users.find((user) => user.correo === 'admin@gmail.com') || null;

const mergeUsers = (seedUsers, savedUsers) => {
  const merged = [...seedUsers];
  const seen = new Set(seedUsers.map((user) => String(user.id)));

  (Array.isArray(savedUsers) ? savedUsers : []).forEach((user) => {
    const userId = String(user?.id || '');
    if (!userId) return;

    const index = merged.findIndex((item) => String(item.id) === userId);
    if (index >= 0) {
      merged[index] = { ...merged[index], ...user };
    } else if (!seen.has(userId)) {
      merged.push(user);
      seen.add(userId);
    }
  });

  const adminSeed = getSeedAdminUser();
  const hasRequestedAdmin = merged.some((user) => user.correo === 'admin@gmail.com' || normalizeText(user.usuario) === 'admin');
  if (adminSeed && !hasRequestedAdmin) {
    merged.unshift(adminSeed);
  }

  return merged;
};

const loadState = () => {
  if (typeof window === 'undefined') return seedState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== 'object') {
    const seeded = seedState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  return {
    ...seedState(),
    ...parsed,
    counters: { ...seedState().counters, ...(parsed.counters || {}) },
    users: mergeUsers(seedState().users, parsed.users),
  };
};

let state = loadState();

const persistState = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const asJsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const readJsonBody = async (request) => {
  try {
    const text = await request.clone().text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
};

const getFormDataImages = async (request) => {
  try {
    const formData = await request.clone().formData();
    return formData.getAll('images');
  } catch {
    return [];
  }
};

const nextId = (type, prefix) => {
  state.counters[type] = Number(state.counters[type] || 0) + 1;
  return `${prefix}${String(state.counters[type]).padStart(4, '0')}`;
};

const normalizeRole = (role) => normalizeText(role);

const parseMaybeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : [];
    }
  }
  return [];
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const computeTotal = (items) => parseMaybeArray(items).reduce((sum, item) => sum + (Number(item?.importe || item?.costo) || 0), 0);

const resolveTechnicianName = (technicianId) => {
  if (!technicianId) return '';
  const user = state.users.find((item) => String(item.id) === String(technicianId));
  return user?.nombre || user?.usuario || '';
};

const withUpdatedOrder = (folio, updater) => {
  const index = state.orders.findIndex((order) => String(order.folio) === String(folio));
  if (index === -1) return null;
  const current = state.orders[index];
  const next = updater({ ...current });
  state.orders[index] = { ...current, ...next, updatedAt: now() };
  persistState();
  return state.orders[index];
};

const toOrderPayload = (payload = {}) => {
  const folio = payload.folio || nextId('order', 'S2605');
  const trabajos = parseMaybeArray(payload.trabajos);
  const technicianId = payload.technicianId ?? payload.tecnicoId ?? null;
  const tecnico = payload.tecnico || resolveTechnicianName(technicianId) || '';
  const presupuestoCliente = parseNumber(payload.presupuestoCliente);
  const presupuestoAdmin = parseNumber(payload.presupuestoAdmin);
  const resumenTotal = parseNumber(payload.resumen?.total);

  return {
    id: payload.id || uid('order'),
    folio,
    fecha: payload.fecha || today(),
    clientName: payload.clientName || payload.nombre || payload.cliente || 'Cliente demo',
    nombre: payload.nombre || payload.clientName || payload.cliente || 'Cliente demo',
    telefono: payload.telefono || '',
    correo: payload.correo || '',
    tipo: payload.tipo || payload.tipoEquipo || 'Servicio',
    marca: payload.marca || '',
    modelo: payload.modelo || '',
    serie: payload.serie || '',
    accesorios: parseMaybeArray(payload.accesorios),
    otrosAccesorios: payload.otrosAccesorios || '',
    seguridad: payload.seguridad || '',
    patron: payload.patron || '[]',
    description: payload.description || payload.descripcion || payload.problema || '',
    observaciones: payload.observaciones || '',
    firma: payload.firma || null,
    status: payload.status || 'Pendiente',
    technicianId,
    tecnico,
    trabajos,
    diagnostico: payload.diagnostico || '',
    resumen: {
      ...(payload.resumen || {}),
      total: Number.isFinite(resumenTotal) ? resumenTotal : computeTotal(trabajos),
    },
    imagenes: parseMaybeArray(payload.imagenes),
    presupuestoCliente,
    presupuestoAdmin,
    estadoPresupuesto: payload.estadoPresupuesto || (Number.isFinite(presupuestoAdmin) ? 'cotizacion_generada' : (Number.isFinite(presupuestoCliente) ? 'cliente_estimado' : 'sin_presupuesto')),
    clienteId: payload.clienteId || null,
    tipoOrden: payload.tipoOrden || (payload.foraneo || payload.external ? 'foraneo' : 'normal'),
    foraneo: Boolean(payload.foraneo || payload.external),
    external: Boolean(payload.external || payload.foraneo),
    deleted: Boolean(payload.deleted),
    deleteReason: payload.deleteReason || '',
    deletedAt: payload.deletedAt || null,
    deletedBy: payload.deletedBy || '',
    createdBy: payload.createdBy || '',
    history: Array.isArray(payload.history) ? payload.history : [],
    createdAt: payload.createdAt || now(),
    updatedAt: now(),
  };
};

const createQuotePayload = (payload = {}) => ({
  id: payload.id || uid('quote'),
  numeroCotizacion: payload.numeroCotizacion || nextId('quote', 'COT-'),
  fecha: payload.fecha || today(),
  vigencia: payload.vigencia || '',
  direccion: payload.direccion || '',
  razonSocial: payload.razonSocial || '',
  rfc: payload.rfc || '',
  repse: payload.repse || '',
  telefono: payload.telefono || '',
  direccionCliente: payload.direccionCliente || '',
  empresa: payload.empresa || '',
  cliente: payload.cliente || '',
  correo: payload.correo || '',
  observaciones: payload.observaciones || '',
  observacionesExtra: payload.observacionesExtra || '',
  status: payload.status || 'Borrador',
  emisor: payload.emisor || 'sinar',
  pruebaRendimiento: Boolean(payload.pruebaRendimiento),
  partidas: parseMaybeArray(payload.partidas),
  otro: payload.otro || '',
  total: Number.isFinite(Number(payload.total)) ? Number(payload.total) : computeTotal(payload.partidas),
  contacto: payload.contacto || payload.cliente || '',
  createdAt: payload.createdAt || now(),
  updatedAt: now(),
});

const listOrders = (query) => {
  const includeDeleted = query.get('deleted') === 'true';
  let result = includeDeleted ? state.orders : state.orders.filter((order) => !order.deleted);

  const folio = query.get('folio');
  if (folio) {
    const normalized = String(folio).toLowerCase();
    result = result.filter((order) => String(order.folio).toLowerCase() === normalized);
  }

  const clienteId = query.get('clienteId');
  if (clienteId) {
    result = result.filter((order) => String(order.clienteId || '') === String(clienteId));
  }

  if (query.get('external') === 'true') {
    result = result.filter((order) => order.external || order.foraneo);
  }

  if (query.get('foraneo') === 'true') {
    result = result.filter((order) => order.foraneo || order.external);
  }

  if (query.get('excludeForeign') === 'true') {
    result = result.filter((order) => !order.foraneo && !order.external);
  }

  const status = query.get('status');
  if (status) {
    const normalizedStatus = normalizeText(status);
    result = result.filter((order) => normalizeText(order.status) === normalizedStatus);
  }

  return deepClone(result);
};

const handleOrders = async (url, request) => {
  const { pathname, searchParams } = url;
  const segments = pathname.split('/').filter(Boolean);
  const folio = segments[2];

  if (request.method === 'GET' && segments.length === 2) {
    return asJsonResponse(listOrders(searchParams));
  }

  if (request.method === 'GET' && segments.length === 3) {
    const order = state.orders.find((item) => String(item.folio) === String(folio));
    return order ? asJsonResponse(deepClone(order)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
  }

  if (request.method === 'POST' && segments.length === 2) {
    const body = await readJsonBody(request);
    const order = toOrderPayload(body);
    state.orders.unshift(order);
    persistState();
    return asJsonResponse(deepClone(order));
  }

  if (request.method === 'POST' && segments[3] === 'upload') {
    const files = await getFormDataImages(request);
    const imagenes = files.map((file, index) => {
      if (typeof file === 'string') return file;
      const name = file?.name || `imagen-${index + 1}`;
      return `mock-image://${encodeURIComponent(name)}`;
    });
    return asJsonResponse({ imagenes });
  }

  if (segments.length >= 3 && request.method === 'PUT') {
    const body = await readJsonBody(request);

    if (segments[3] === 'trabajos') {
      const updated = withUpdatedOrder(folio, () => ({
        trabajos: parseMaybeArray(body.trabajos),
        resumen: { total: computeTotal(body.trabajos) },
      }));
      return updated ? asJsonResponse({ trabajos: updated.trabajos }) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'diagnostico') {
      const updated = withUpdatedOrder(folio, () => ({ diagnostico: body.diagnostico || '' }));
      return updated ? asJsonResponse({ diagnostico: updated.diagnostico }) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'estado') {
      const updated = withUpdatedOrder(folio, (order) => ({
        status: body.status || body.estado || order.status,
        history: [...(order.history || []), { status: body.status || body.estado || order.status, date: now() }],
      }));
      return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'tecnico') {
      const updated = withUpdatedOrder(folio, () => ({
        technicianId: body.technicianId || body.tecnicoId || null,
        tecnico: body.tecnico || resolveTechnicianName(body.technicianId || body.tecnicoId) || '',
      }));
      return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'presupuesto-aceptar' || segments[3] === 'presupuesto-cliente-acepta') {
      const updated = withUpdatedOrder(folio, () => ({ presupuestoCliente: body.presupuestoCliente ?? body.presupuesto ?? true, estadoPresupuesto: 'cotizacion_aprobada' }));
      return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'presupuesto-cliente-rechaza') {
      const updated = withUpdatedOrder(folio, () => ({ estadoPresupuesto: 'cotizacion_rechazada' }));
      return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'presupuesto-admin') {
      const updated = withUpdatedOrder(folio, () => ({ presupuestoAdmin: body.presupuestoAdmin ?? body.presupuesto ?? null, estadoPresupuesto: body.presupuestoAdmin ? 'cotizacion_generada' : 'sin_presupuesto' }));
      return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    if (segments[3] === 'images') {
      const updated = withUpdatedOrder(folio, () => ({ imagenes: parseMaybeArray(body.imagenes).slice(0, 2) }));
      return updated ? asJsonResponse({ imagenes: updated.imagenes }) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    const updated = withUpdatedOrder(folio, (order) => ({
      ...body,
      folio: order.folio,
      tecnico: body.technicianId || body.tecnicoId ? resolveTechnicianName(body.technicianId || body.tecnicoId) : (body.tecnico || order.tecnico),
      trabajos: Array.isArray(body.trabajos) ? body.trabajos : order.trabajos,
      imagenes: Array.isArray(body.imagenes) ? body.imagenes : order.imagenes,
      resumen: body.resumen || order.resumen,
    }));

    return updated ? asJsonResponse(deepClone(updated)) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
  }

  if (segments.length >= 3 && request.method === 'DELETE') {
    if (segments[3] === 'images') {
      const body = await readJsonBody(request);
      const updated = withUpdatedOrder(folio, (order) => ({ imagenes: (order.imagenes || []).filter((image) => image !== body.imageUrl) }));
      return updated ? asJsonResponse({ imagenes: updated.imagenes }) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
    }

    const updated = withUpdatedOrder(folio, () => ({ deleted: true, deletedAt: now(), deletedBy: 'demo', deleteReason: 'Eliminada desde la interfaz demo' }));
    return updated ? asJsonResponse({ success: true }) : asJsonResponse({ error: 'Orden no encontrada' }, 404);
  }

  return null;
};

const handleQuotes = async (url, request) => {
  const { pathname } = url;
  const segments = pathname.split('/').filter(Boolean);
  const id = segments[2];

  if (request.method === 'GET' && segments.length === 2) {
    return asJsonResponse(deepClone(state.quotes.filter((quote) => !quote.deleted)));
  }

  if (request.method === 'GET' && segments.length === 3) {
    const quote = state.quotes.find((item) => String(item.id) === String(id));
    return quote ? asJsonResponse(deepClone(quote)) : asJsonResponse({ error: 'Cotización no encontrada' }, 404);
  }

  if (request.method === 'POST' && segments.length === 2) {
    const body = await readJsonBody(request);
    const quote = createQuotePayload(body);
    state.quotes.unshift(quote);
    persistState();
    return asJsonResponse({ quote: deepClone(quote) });
  }

  if (request.method === 'PUT' && segments.length === 3) {
    const body = await readJsonBody(request);
    const index = state.quotes.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return asJsonResponse({ error: 'Cotización no encontrada' }, 404);

    const current = state.quotes[index];
    const next = { ...current, ...body, partidas: body.partidas ? parseMaybeArray(body.partidas) : current.partidas, total: Number.isFinite(Number(body.total)) ? Number(body.total) : current.total, updatedAt: now() };
    state.quotes[index] = next;
    persistState();
    return asJsonResponse({ quote: deepClone(next) });
  }

  if (request.method === 'DELETE' && segments.length === 3) {
    const index = state.quotes.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return asJsonResponse({ error: 'Cotización no encontrada' }, 404);
    state.quotes.splice(index, 1);
    persistState();
    return asJsonResponse({ success: true });
  }

  return null;
};

const handleUsers = async (url, request) => {
  const { pathname } = url;
  const segments = pathname.split('/').filter(Boolean);
  const id = segments[2];

  if (request.method === 'POST' && segments[2] === 'login') {
    const body = await readJsonBody(request);
    const correo = String(body.correo || '').trim().toLowerCase();
    const contrasena = String(body.contrasena || '').trim();

    if (correo === 'admin@gmail.com' && contrasena === 'admin') {
      return asJsonResponse({ success: true, user: deepClone(getSeedAdminUser()) });
    }

    const user = state.users.find((item) => String(item.correo || '').trim().toLowerCase() === correo && String(item.contrasena || '').trim() === contrasena);
    if (!user) return asJsonResponse({ success: false, message: 'Credenciales incorrectas' }, 401);
    return asJsonResponse({ success: true, user: deepClone(user) });
  }

  if (request.method === 'GET' && segments.length === 2) {
    return asJsonResponse(deepClone(state.users));
  }

  if (request.method === 'POST' && segments.length === 2) {
    const body = await readJsonBody(request);
    const user = { id: uid('user'), nombre: body.nombre || '', correo: body.correo || '', contrasena: body.contrasena || '', rol: body.rol || 'Técnico', estado: body.estado || 'Activo', usuario: body.usuario || body.correo || '' };
    state.users.push(user);
    persistState();
    return asJsonResponse(deepClone(user));
  }

  if (request.method === 'PUT' && segments.length === 3) {
    const body = await readJsonBody(request);
    const index = state.users.findIndex((user) => String(user.id) === String(id));
    if (index === -1) return asJsonResponse({ error: 'Usuario no encontrado' }, 404);
    const current = state.users[index];
    const updated = { ...current, ...body, contrasena: body.contrasena ? body.contrasena : current.contrasena, usuario: body.usuario || current.usuario || current.correo };
    state.users[index] = updated;
    persistState();
    return asJsonResponse(deepClone(updated));
  }

  if (request.method === 'DELETE' && segments.length === 3) {
    state.users = state.users.filter((user) => String(user.id) !== String(id));
    persistState();
    return asJsonResponse({ success: true });
  }

  return null;
};

const handleClients = async (url, request) => {
  const { pathname } = url;
  const segments = pathname.split('/').filter(Boolean);
  const id = segments[2];

  if (request.method === 'POST' && segments[2] === 'login') {
    const body = await readJsonBody(request);
    const usuarioInput = String(body.usuario || '').trim();
    const contrasenaInput = String(body.contrasena || '').trim();

    // Allow logging in with a user account (admin/demo) via the client login endpoint for convenience in the mock.
    const matchedUser = state.users.find((u) => (String(u.correo || '').trim().toLowerCase() === usuarioInput.toLowerCase() || String(u.usuario || '').trim().toLowerCase() === usuarioInput.toLowerCase()) && String(u.contrasena || '') === contrasenaInput);
    if (matchedUser) {
      const clientFromUser = {
        id: `c-from-${matchedUser.id}`,
        nombre: matchedUser.nombre || matchedUser.usuario || matchedUser.correo || 'Admin',
        correo: matchedUser.correo || '',
        telefono: matchedUser.telefono || '',
        usuario: matchedUser.usuario || matchedUser.correo || usuarioInput,
        contrasena: matchedUser.contrasena || contrasenaInput,
        activo: true,
      };
      return asJsonResponse({ success: true, client: deepClone(clientFromUser) });
    }

    const client = state.clients.find((item) => item.usuario === body.usuario && item.contrasena === body.contrasena);
    if (!client) return asJsonResponse({ success: false, message: 'Usuario o contraseña incorrectos' }, 401);
    return asJsonResponse({ success: true, client: deepClone(client) });
  }

  if (request.method === 'GET' && segments.length === 2) {
    return asJsonResponse(deepClone(state.clients));
  }

  if (request.method === 'POST' && segments.length === 2) {
    const body = await readJsonBody(request);
    const client = { id: uid('client'), nombre: body.nombre || '', correo: body.correo || '', telefono: body.telefono || '', usuario: body.usuario || '', contrasena: body.contrasena || '', activo: body.activo !== undefined ? Boolean(body.activo) : true };
    state.clients.push(client);
    persistState();
    return asJsonResponse(deepClone(client));
  }

  if (request.method === 'PUT' && segments.length === 3) {
    const body = await readJsonBody(request);
    const index = state.clients.findIndex((client) => String(client.id) === String(id));
    if (index === -1) return asJsonResponse({ error: 'Cliente no encontrado' }, 404);
    const current = state.clients[index];
    const updated = { ...current, ...body, contrasena: body.contrasena ? body.contrasena : current.contrasena, activo: body.activo !== undefined ? Boolean(body.activo) : current.activo };
    state.clients[index] = updated;
    persistState();
    return asJsonResponse(deepClone(updated));
  }

  if (request.method === 'DELETE' && segments.length === 3) {
    state.clients = state.clients.filter((client) => String(client.id) !== String(id));
    persistState();
    return asJsonResponse({ success: true });
  }

  return null;
};

const handleProducts = async (url, request) => {
  const { pathname } = url;
  const segments = pathname.split('/').filter(Boolean);
  const id = segments[2];

  if (request.method === 'GET' && segments.length === 2) {
    return asJsonResponse(deepClone(state.products));
  }

  if (request.method === 'POST' && segments.length === 2) {
    const body = await readJsonBody(request);
    const product = { id: uid('product'), nombre: body.nombre || '', descripcion: body.descripcion || '', unidad: body.unidad || '', precioBase: Number(body.precioBase) || 0 };
    state.products.unshift(product);
    persistState();
    return asJsonResponse({ product: deepClone(product) });
  }

  if (request.method === 'PUT' && segments.length === 3) {
    const body = await readJsonBody(request);
    const index = state.products.findIndex((product) => String(product.id) === String(id));
    if (index === -1) return asJsonResponse({ error: 'Producto no encontrado' }, 404);
    const updated = { ...state.products[index], ...body, precioBase: Number(body.precioBase) || 0 };
    state.products[index] = updated;
    persistState();
    return asJsonResponse({ product: deepClone(updated) });
  }

  if (request.method === 'DELETE' && segments.length === 3) {
    state.products = state.products.filter((product) => String(product.id) !== String(id));
    persistState();
    return asJsonResponse({ success: true });
  }

  return null;
};

const handleTechnicians = async () => asJsonResponse(deepClone(state.users.filter((user) => normalizeRole(user.rol).includes('tecnico'))));

const handleApiRequest = async (input, init = {}) => {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url, window.location.origin);

  if (!url.pathname.startsWith('/api/')) return null;

  if (url.pathname === '/api/users/login') return handleUsers(url, request);
  if (url.pathname === '/api/clients/login') return handleClients(url, request);
  if (url.pathname.startsWith('/api/orders')) return handleOrders(url, request);
  if (url.pathname.startsWith('/api/quotes')) return handleQuotes(url, request);
  if (url.pathname.startsWith('/api/users')) return handleUsers(url, request);
  if (url.pathname.startsWith('/api/clients')) return handleClients(url, request);
  if (url.pathname.startsWith('/api/products')) return handleProducts(url, request);
  if (url.pathname === '/api/technicians') return handleTechnicians(url, request);

  return asJsonResponse({ error: `Ruta mock no implementada: ${url.pathname}` }, 404);
};

export const installMockApi = () => {
  if (typeof window === 'undefined') return;
  if (window.__MOCK_API_INSTALLED__) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const mockResponse = await handleApiRequest(input, init);
    if (mockResponse) return mockResponse;
    return originalFetch(input, init);
  };

  window.__MOCK_API_INSTALLED__ = true;
  window.__MOCK_API__ = {
    getState: () => deepClone(state),
    reset: () => {
      state = seedState();
      persistState();
      return deepClone(state);
    },
  };
};

export const getMockApiState = () => deepClone(state);
