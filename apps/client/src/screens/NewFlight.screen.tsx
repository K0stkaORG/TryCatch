import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import ScreenTemplate from "@/components/ScreenTemplate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewFlightRequest } from "@try-catch/shared-types";
import { Rocket, Signal, Sparkles } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

const NewFlightScreen = () => {
	const navigate = useNavigate();

	const form = useForm({
		resolver: zodResolver(NewFlightRequest),
		defaultValues: {
			name: "",
		},
	});

	const onSubmit = useCallback(
		async (data: NewFlightRequest) => {
			const response = await request<NewFlightRequest, void>({
				path: "/flights/new",
				data,
			});

			if (response.result === "success") navigate(`/flight/active`);
		},
		[navigate],
	);

	return (
		<ScreenTemplate
			title="New Launch"
			backPath="/">
			<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				<Card className="bg-card/60 border-border/60">
					<CardHeader>
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-muted-foreground flex items-center gap-2 text-sm">
									<div className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
										<Sparkles className="size-4" />
									</div>
									<span>Launch briefing</span>
								</div>
								<CardTitle className="mt-1 text-xl">Prepare the mission</CardTitle>
								<p className="text-muted-foreground mt-2 text-sm">
									Set the flight name and start the telemetry link. Everything else syncs
									automatically.
								</p>
							</div>
							<div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-xl">
								<Signal className="size-4" />
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="bg-muted/30 rounded-2xl border px-4 py-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Step 1</span>
								<span className="font-semibold">Name the launch</span>
							</div>
						</div>
						<div className="bg-muted/30 rounded-2xl border px-4 py-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Step 2</span>
								<span className="font-semibold">Confirm the uplink</span>
							</div>
						</div>
						<div className="bg-muted/30 rounded-2xl border px-4 py-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Step 3</span>
								<span className="font-semibold">Start live tracking</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-card/60 border-border/60">
					<CardHeader>
						<div className="mb-2 flex items-center gap-2">
							<div className="bg-primary/15 text-primary rounded-lg p-2">
								<Rocket className="size-5" />
							</div>
							<span className="text-muted-foreground text-sm">Mission setup</span>
						</div>
						<CardTitle>Create launch</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Launch name</FormLabel>
											<FormControl>
												<Input
													placeholder="CRC 2026 — Test Flight A"
													value={field.value}
													onChange={field.onChange}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="pt-2">
									<Button
										type="submit"
										className="flex w-full items-center gap-2"
										size="lg">
										<Rocket className="size-5" />
										Start launch
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</ScreenTemplate>
	);
};

export default NewFlightScreen;
