import { proxyRequest } from '@/lib/proxy';

export async function GET(request, context) {
  return proxyRequest(request, context.params);
}
export async function POST(request, context) {
  return proxyRequest(request, context.params);
}
export async function PUT(request, context) {
  return proxyRequest(request, context.params);
}
export async function PATCH(request, context) {
  return proxyRequest(request, context.params);
}
export async function DELETE(request, context) {
  return proxyRequest(request, context.params);
}
export { OPTIONS } from '@/lib/proxy';
