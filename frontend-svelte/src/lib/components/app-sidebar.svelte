<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import House from "phosphor-svelte/lib/House";
</script>

<Sidebar.Root>
	<Sidebar.Header>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Pharma OS</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a href="#/" {...props}>
									<House />
									<span>Dashboard</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Header>
</Sidebar.Root>
