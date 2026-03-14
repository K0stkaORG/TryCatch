import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import ScreenTemplate from "@/components/ScreenTemplate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { request } from "@/lib/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewFlightRequest } from "@try-catch/shared-types";
import { CirclePlus, Gamepad2 } from "lucide-react";
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
			title="New Flight"
			backPath="/">
			<div className="mx-auto max-w-xl">
				<Card>
					<CardHeader>
						<div className="mb-2 flex items-center gap-2">
							<div className="bg-primary/10 text-primary rounded-lg p-2">
								<Gamepad2 className="size-6" />
							</div>
						</div>
						<CardTitle>Create Flight</CardTitle>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-6">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input
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
										<CirclePlus className="size-5" />
										Create Flight
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
