export const SUBJECTS = {
  pedido_recebido: (n: string) => `Recebemos seu pedido ${n}`,
  pagamento_aprovado: (n: string) => `Pagamento aprovado: pedido ${n}`,
  nota_emitida: (n: string) => `Nota fiscal do pedido ${n}`,
  pedido_enviado: (n: string) => `Seu pedido ${n} saiu para entrega`,
  pedido_entregue: (n: string) => `Pedido ${n} entregue`,
};
