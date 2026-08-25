import { useState } from "react";
import {
  CalendarDays,
  Save,
  TicketPercent,
  Plus,
  Trash2,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CouponsManager() {
  const { d } = useLanguage();
  const utils = trpc.useUtils();
  const list = trpc.coupons.list.useQuery();
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [editingCoupons, setEditingCoupons] = useState<
    Record<
      number,
      { code: string; percent: string; validFrom: string; validUntil: string }
    >
  >({});
  const [msg, setMsg] = useState("");

  const invalidate = () => utils.coupons.list.invalidate();

  const create = trpc.coupons.create.useMutation({
    onSuccess: () => {
      setMsg(d.admin.couponCreated);
      setCode("");
      setPercent("");
      setValidFrom("");
      setValidUntil("");
      invalidate();
    },
    onError: error =>
      setMsg(
        error.message === "invalid_date_range"
          ? "A data inicial não pode ser posterior à data final."
          : error.data?.code === "CONFLICT"
            ? "Este cupom já existe."
            : d.admin.couponError
      ),
  });
  const toggle = trpc.coupons.toggle.useMutation({
    onSuccess: invalidate,
    onError: () => setMsg(d.admin.couponError),
  });
  const remove = trpc.coupons.remove.useMutation({
    onSuccess: invalidate,
    onError: () => setMsg(d.admin.couponError),
  });
  const update = trpc.coupons.update.useMutation({
    onSuccess: () => {
      setMsg("Cupom atualizado.");
      invalidate();
    },
    onError: error =>
      setMsg(
        error.message === "invalid_date_range"
          ? "A data inicial não pode ser posterior à data final."
          : error.data?.code === "CONFLICT"
            ? "Este cupom já existe."
            : d.admin.couponError
      ),
  });

  const formatDate = (value?: string | null) => {
    if (!value) return "";
    const [year, month, day] = value.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  };

  const formatValidity = (from?: string | null, until?: string | null) => {
    const start = formatDate(from);
    const end = formatDate(until);
    if (start && end) return `${start} até ${end}`;
    if (start) return `Válido a partir de ${start}\nSem data final`;
    if (end) return `Válido imediatamente\nAté ${end}`;
    return "Válido imediatamente\nSem data final";
  };

  const canSaveRange = (from: string, until: string) =>
    !from || !until || from <= until;

  const getEditingCoupon = (coupon: {
    id: number;
    code: string;
    percent: number;
    validFrom?: string | null;
    validUntil?: string | null;
  }) =>
    editingCoupons[coupon.id] ?? {
      code: coupon.code,
      percent: String(coupon.percent),
      validFrom: coupon.validFrom ?? "",
      validUntil: coupon.validUntil ?? "",
    };

  const setEditingCoupon = (
    coupon: {
      id: number;
      code: string;
      percent: number;
      validFrom?: string | null;
      validUntil?: string | null;
    },
    patch: Partial<{
      code: string;
      percent: string;
      validFrom: string;
      validUntil: string;
    }>
  ) => {
    setEditingCoupons(current => ({
      ...current,
      [coupon.id]: {
        code: current[coupon.id]?.code ?? coupon.code,
        percent: current[coupon.id]?.percent ?? String(coupon.percent),
        validFrom: current[coupon.id]?.validFrom ?? coupon.validFrom ?? "",
        validUntil: current[coupon.id]?.validUntil ?? coupon.validUntil ?? "",
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-serif-display text-xl font-semibold">
            <TicketPercent className="h-5 w-5 text-primary" />{" "}
            {d.admin.couponsTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {d.admin.couponsHint}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_8rem_11rem_11rem_auto] lg:items-end">
            <div className="min-w-48 flex-1">
              <Label htmlFor="coupon-code">{d.admin.couponCode}</Label>
              <Input
                id="coupon-code"
                className="mt-1.5 uppercase"
                placeholder="VILASANTAROSABRAZIL"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="w-32">
              <Label htmlFor="coupon-percent">{d.admin.couponPercent}</Label>
              <div className="relative mt-1.5">
                <Input
                  id="coupon-percent"
                  type="number"
                  min={1}
                  max={90}
                  placeholder="5"
                  value={percent}
                  onChange={e => setPercent(e.target.value)}
                />
                <Percent className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="min-w-44">
              <Label htmlFor="coupon-valid-from">Válido a partir de</Label>
              <Input
                id="coupon-valid-from"
                className="mt-1.5"
                type="date"
                value={validFrom}
                onChange={e => setValidFrom(e.target.value)}
              />
            </div>
            <div className="min-w-44">
              <Label htmlFor="coupon-valid-until">Válido até</Label>
              <Input
                id="coupon-valid-until"
                className="mt-1.5"
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
              />
            </div>
            <Button
              className="sm:col-span-2 lg:col-span-1"
              disabled={
                create.isPending ||
                code.trim().length < 3 ||
                !percent ||
                !canSaveRange(validFrom, validUntil)
              }
              onClick={() => {
                if (!canSaveRange(validFrom, validUntil)) {
                  setMsg("A data inicial não pode ser posterior à data final.");
                  return;
                }
                create.mutate({
                  code: code.trim(),
                  percent: Number(percent),
                  validFrom: validFrom || null,
                  validUntil: validUntil || null,
                });
              }}
            >
              <Plus className="me-1.5 h-4 w-4" /> {d.admin.couponAdd}
            </Button>
          </div>
          {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(list.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            {d.admin.couponsEmpty}
          </p>
        )}
        {(list.data ?? []).map(c => {
          const edit = getEditingCoupon(c);
          return (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold tracking-wide">
                    {c.code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.percent}% OFF
                  </p>
                  <p className="mt-1 flex items-start gap-1.5 whitespace-pre-line text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      Válido: {formatValidity(c.validFrom, c.validUntil)}
                    </span>
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,14rem)_7rem_10rem_10rem_auto_auto] lg:items-end">
                    <div>
                      <Label
                        htmlFor={`coupon-code-${c.id}`}
                        className="text-xs"
                      >
                        Código
                      </Label>
                      <Input
                        id={`coupon-code-${c.id}`}
                        className="mt-1 h-8 uppercase"
                        value={edit.code}
                        onChange={e =>
                          setEditingCoupon(c, {
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`coupon-percent-${c.id}`}
                        className="text-xs"
                      >
                        Desconto %
                      </Label>
                      <Input
                        id={`coupon-percent-${c.id}`}
                        type="number"
                        min={1}
                        max={90}
                        className="mt-1 h-8"
                        value={edit.percent}
                        onChange={e =>
                          setEditingCoupon(c, { percent: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`coupon-valid-from-${c.id}`}
                        className="text-xs"
                      >
                        Válido a partir de
                      </Label>
                      <Input
                        id={`coupon-valid-from-${c.id}`}
                        type="date"
                        className="mt-1 h-8"
                        value={edit.validFrom}
                        onChange={e =>
                          setEditingCoupon(c, { validFrom: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`coupon-valid-until-${c.id}`}
                        className="text-xs"
                      >
                        Válido até
                      </Label>
                      <Input
                        type="date"
                        className="mt-1 h-8"
                        value={edit.validUntil}
                        onChange={e =>
                          setEditingCoupon(c, { validUntil: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        update.isPending ||
                        edit.code.trim().length < 3 ||
                        !edit.percent ||
                        !canSaveRange(edit.validFrom, edit.validUntil)
                      }
                      onClick={() => {
                        if (!canSaveRange(edit.validFrom, edit.validUntil)) {
                          setMsg(
                            "A data inicial não pode ser posterior à data final."
                          );
                          return;
                        }
                        update.mutate({
                          id: c.id,
                          code: edit.code.trim(),
                          percent: Number(edit.percent),
                          validFrom: edit.validFrom || null,
                          validUntil: edit.validUntil || null,
                        });
                      }}
                    >
                      <Save className="me-1.5 h-3.5 w-3.5" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={update.isPending}
                      onClick={() => {
                        setEditingCoupon(c, { validFrom: "", validUntil: "" });
                        update.mutate({
                          id: c.id,
                          validFrom: null,
                          validUntil: null,
                        });
                      }}
                    >
                      Sem datas
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start">
                  <Switch
                    checked={c.active}
                    onCheckedChange={v =>
                      toggle.mutate({ id: c.id, active: v })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate({ id: c.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
